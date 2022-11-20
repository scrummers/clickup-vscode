import { commands, ExtensionContext, ThemeIcon, TreeView, window } from 'vscode'
import { Commands } from '../commands'
import { ClickUpService } from '../service/click_up_service'
import { LocalStorageService } from '../service/local_storage_service'
import { EnumTreeView, TreeViewDataProvider } from '../service/TreeView'
import { TaskItem } from '../service/TreeView/TaskTreeView'
import { AppState, appStateChangeEventEmitter } from '../store'
import { TAppState } from '../store/AppState'
import { ApiNewTaskSchema, ApiUpdateTaskSchema, EnumTodoLabel, Priority, SpaceLListFile, StateSpaceList, Status, Tag, Task, TaskTreeViewData, Teams, User } from '../util/typings/clickup'
import { EnumLocalStorage } from '../util/typings/system'

let instance: Client | null = null

export class Client {
  public service!: ClickUpService
  public tree!: TreeView<TaskItem>
  private storage!: LocalStorageService
  private context!: ExtensionContext

  constructor(context?: ExtensionContext) {
    if (instance) {
      return instance
    }

    instance = this

    if (!context) {
      return
    }

    this.context = context

    this.storage = new LocalStorageService(context.workspaceState)
    const token = this.storage.getValue(EnumLocalStorage.Token) as string
    if (!token) {
      // window.showWarningMessage('Please enter a valid user token!')
      commands.executeCommand(Commands.ClickupSetToken)
      return
    }

    this.init(token)
  }

  async init(token: string): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        this.setIsLoading(true)
        const service = new ClickUpService(this.storage)
        const me = await service.setup(token)
        this.service = service
        this.stateUpdateMe(me)

        // init space environment
        const crntSpace = this.storage.getValue(EnumLocalStorage.CrntSpace) as {
          name: string
          id: string
        }

        if (!crntSpace) {
          commands.executeCommand(Commands.ClickupSelectWorkspace)
        }

        const crntWorkspace = this.storage.getValue(EnumLocalStorage.CrntWorkspace) as Teams
        // if (!crntWorkspace) {
        //   crntWorkspace = await this.service.getTeams()
        // }
        this.stateGetWorkspace(crntWorkspace.id)

        console.log(`[debug]: loading space ${crntSpace.name} #${crntSpace.id}`)

        await this.setupTreeView(crntSpace.id)
        this.setIsLoading(false)
        // update state
        resolve(me)
      } catch (err) {
        this.setIsLoading(false)
        reject(err)
      }
    })
  }

  // public async fetchWorkspaces(): Promise<Teams[]> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const teams = await this.service.getTeams()
  //       // AppState.clickup.workspaces = teams
  //       resolve(teams)
  //     } catch (err) {
  //       reject(err)
  //     }
  //   })
  // }
  private async getMe(): Promise<User | null> {
    const me = this.storage.getValue(EnumLocalStorage.Me) as User
    if (!me) {
      commands.executeCommand(Commands.ClickupGetMyData)
      return null
    }
    return me
  }

  // setup tree view
  async setupTreeView(spaceId: string) {
    // const spaceTree = await this.service.getSpaceTree(spaceId + '')
    const me = await this.getMe()
    if (!me) return
    const myId = me.id

    const treeData = await this.fetchTreeViewData(spaceId, myId)

    if (!treeData) return

    this.tree = window.createTreeView('clickup-tasks', {
      treeDataProvider: new TreeViewDataProvider.TaskTreeView(treeData),
      showCollapseAll: false,
    })
    this.tree.onDidChangeSelection(e => {
      // console.log(e)
    })
    this.tree.onDidCollapseElement(e => {
      // console.log(e); // breakpoint here for debug
    });
    this.tree.onDidChangeVisibility(e => {
      // console.log(e); // breakpoint here for debug
    });
    this.tree.onDidExpandElement(e => {
      // console.log(e); // breakpoint here for debug
    });

    this.context.subscriptions.push(this.tree);


    // const templistId = spaceTree.folders[0].lists[0].id
    // this.stateGetListStatus(templistId)
    // this.stateGetListMembers(templistId)
    // this.stateGetProrities(spaceId)
    // this.stateGetSpaceTags(spaceId)
    // this.stateGetWorkspace()
  }

  // token
  isTokenExist(): boolean {
    return !!this.storage.getValue(EnumLocalStorage.Token)
  }

  async setToken(token: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const me = await this.init(token)
        this.stateUpdateMe(me)
        this.storage.setValue(EnumLocalStorage.Token, token)
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  async fetchTreeViewData(spaceId: string, myId: number) {
    try {
      this.setIsLoading(true)
      const spaceTree = await this.service.getSpaceTree(spaceId + '')
      const todoTaskMap = this.service.getTodoTasks(spaceTree, [myId])

      let todos: TaskTreeViewData[] = []
      Object.keys(todoTaskMap).map((key) => {
        const item = {
          label: key,
          tasks: todoTaskMap[key],
        }
        todos.push(item)
      })

      const _allTasks = [
        ...spaceTree.folders,
        {
          name: '$Root',
          lists: [...spaceTree.root_lists],
        },
      ]

      const flatAllTasks: TaskTreeViewData[] = []
      _allTasks.forEach((item) => {
        item.lists.forEach((list) => {
          flatAllTasks.push({
            label: `${item.name}/${list.name}`,
            tasks: list.tasks,
            ...(list.id && { listId: list.id }),
            ...(list.folder && { folderId: list.folder.id }),
          })
        })
      })

      this.stateUpdateSpaceList(spaceTree)
      this.stateUpdateSpacePriorities(spaceTree)
      this.stateUpdateSpace(spaceTree)
      this.setIsLoading(false)


      return [
        {
          label: 'To Do',
          items: todos,
        },
        {
          label: 'All Space Tasks',
          items: flatAllTasks,
        },
      ]

    } catch (err) {
      console.error(err)
    }
  }

  // API handler
  async createNewTask(listId: string, data: ApiNewTaskSchema) {
    try {
      this.setIsLoading(true)
      const resp = await this.service.newTask(listId, data)
      console.log({ resp })
      return resp
    } catch (err) {
      console.error(err)
    } finally {
      this.setIsLoading(false)
    }
  }

  async updateTaskTags(listId: string, taskId: string, newTags: string[]): Promise<void> {
    try {
      const latestTask = await this.stateGetTaskData(listId, taskId)
      if (!latestTask) {
        throw new Error('Task not found, maybe deleted from platform')
      }
      await this.service.updateTaskTags(taskId, latestTask.tags, newTags)
      Promise.resolve()

    } catch (err) {
      Promise.reject(err)
    }
  }

  async updateTaskField(listId: string, taskId: string, fieldname: keyof ApiUpdateTaskSchema, value: any) {
    try {
      const latestTask = await this.stateGetTaskData(listId, taskId)
      if (!latestTask) {
        throw new Error('Task not found, maybe deleted from platform')
      }
      const assigneesRem = latestTask.assignees.map((a) => a.id)
      const initData: ApiUpdateTaskSchema = {
        name: latestTask.name,
        description: latestTask.description,
        priority: latestTask.priority ? +latestTask.priority.id : null,
        due_date: +latestTask.due_date,
        due_date_time: true,
        time_estimate: +latestTask.time_estimate,
        start_date: +latestTask.start_date,
        start_date_time: true,
        parent: latestTask.parent,
        archived: latestTask.archived,
        assignees: {
          add: [],
          rem: assigneesRem
        },
        status: latestTask.status.status,
      }

      const data: ApiUpdateTaskSchema = {
        ...initData,
        ...(fieldname !== "assignees" && { [fieldname]: value }),
        ...(fieldname === "assignees" && { assignees: { ...initData.assignees, add: value } })
      }

      return this.updateTask(taskId, data)
    } catch (err) {
      this.setIsLoading(false)
    }
  }

  async updateTask(taskId: string, data: ApiUpdateTaskSchema) {
    try {
      this.setIsLoading(true)
      const resp = await this.service.updateTask(taskId, data)
      return resp
    } catch (err) {
      console.error(err)
    } finally {
      this.setIsLoading(false)
    }
  }


  // remove all data once token is deleted
  deleteToken() {
    this.storage.clearAll()
    AppState.crntSpace = null
    AppState.me = null
    appStateChangeEventEmitter.fire()
  }

  // // App state with side effect
  get getAppState(): TAppState {
    return AppState
  }

  async stateGetTaskData(listId: string, taskId: string) {
    try {
      this.setIsLoading(true)
      const tasks = await this.service.getTasks(listId)
      const task = tasks.find((t) => t.id === taskId)
      return task
    } catch (err) {

    } finally {
      this.setIsLoading(false)
    }
  }

  async stateGetSpaceList(): Promise<StateSpaceList[]> {
    return Promise.resolve(AppState.spaceList || [])
  }

  async stateGetSpaceTags(spaceId: string): Promise<Tag[]> {
    try {
      this.setIsLoading(true)
      const tags = await this.service.getTags(spaceId)
      return Promise.resolve(tags)
    } catch (err) {
      return Promise.reject()
    } finally {
      this.setIsLoading(false)
    }
  }

  async stateGetListStatus(listId: string): Promise<Status[]> {
    return new Promise(async (resolve, reject) => {
      try {
        this.setIsLoading(true)
        const status = await this.service.getStatus(listId)
        resolve(status)
      } catch (err) {
        reject(err)
      } finally {
        this.setIsLoading(false)
      }
    })
  }

  async stateGetProrities(): Promise<Priority[]> {
    return Promise.resolve(AppState.spacePriorities || [])
  }

  async stateGetListMembers(listId: string) {
    try {
      this.setIsLoading(true)
      const members = await this.service.getMembers(listId)
      return members
    } catch (err) {
    } finally {
      this.setIsLoading(false)
    }
  }

  async stateGetWorkspace(teamId: string) {
    try {
      this.setIsLoading(true)
      const allTeams = await this.service.getTeams()
      const team = allTeams.find((t) => t.id === teamId)
      const members = team?.members!.map((m) => m.user)
      AppState.spaceMembers = members!
      this.stateUpdateTeams(team!)
    } catch (err) {

    } finally {
      this.setIsLoading(false)
    }
  }

  async reloadSpaceTree() {
    try {
      this.setIsLoading(true)
      if (!AppState.crntSpace) {
        return
      }
      await this.setupTreeView(AppState.crntSpace.id)
    } catch (err) {

    } finally {
      this.setIsLoading(false)
    }
  }

  setIsLoading(bool: Boolean) {
    AppState.isLoading = bool
    appStateChangeEventEmitter.fire()
  }

  stateUpdateSpaceList(spaceTree: SpaceLListFile) {
    const spaceList: StateSpaceList[] = []
    spaceTree.folders.forEach((f) => {
      f.lists.forEach((l) => {
        spaceList.push({
          label: `${f.name}/${l.name}`,
          folderId: f.id,
          foldername: f.name,
          ...l
        })
      })
    })
    spaceTree.root_lists.forEach((l) => {
      spaceList.push({
        label: `$root/${l.name}`,
        folderId: null,
        foldername: null,
        ...l
      })
    })
    console.log({ spaceList })
    AppState.spaceList = spaceList
  }

  stateUpdateSpace(spaceTree: SpaceLListFile) {
    AppState.crntSpace = spaceTree
    AppState.crntSpaceId = spaceTree.id
    const crntSpace = {
      id: spaceTree.id,
      name: spaceTree.name,
    }
    this.storage.setValue(EnumLocalStorage.CrntSpace, crntSpace)
    appStateChangeEventEmitter.fire()
  }

  stateUpdateSpacePriorities(spaceTree: SpaceLListFile) {
    AppState.spacePriorities = spaceTree.features.priorities.priorities
    appStateChangeEventEmitter.fire()
  }

  stateUpdateTeams(team: Teams) {
    AppState.crntWorkspace = team
    this.storage.setValue(EnumLocalStorage.CrntWorkspace, {
      id: team.id,
      team: team.name
    })
    appStateChangeEventEmitter.fire()
  }

  stateUpdateMe(user: User) {
    AppState.me = user
    this.storage.setValue(EnumLocalStorage.Me, user)
    appStateChangeEventEmitter.fire()
  }

  static destory() {
    instance = null
  }
}
