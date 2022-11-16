import { commands, ExtensionContext, TreeView, window } from 'vscode'
import { Commands } from '../commands'
import { ClickUpService } from '../service/click_up_service'
import { LocalStorageService } from '../service/local_storage_service'
import { EnumTreeView, TreeViewDataProvider } from '../service/TreeView'
import { TaskItem } from '../service/TreeView/TaskTreeView'
import { AppState, appStateChangeEventEmitter } from '../store'
import { ApiNewTaskSchema, EnumTodoLabel, SpaceLListFile, StateSpaceList, TaskTreeViewData, Teams, User } from '../util/typings/clickup'
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

        console.log(`[debug]: loading space ${crntSpace.name} #${crntSpace.id}`)

        await this.setupTreeView(crntSpace.id)
        // update state
        resolve(me)
      } catch (err) {
        this.setIsLoading(false)
        reject(err)
      }
    })
  }

  public async fetchWorkspaces(): Promise<Teams[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const teams = await this.service.getTeams()
        // AppState.clickup.workspaces = teams
        resolve(teams)
      } catch (err) {
        reject(err)
      }
    })
  }
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
    const spaceTree = await this.service.getSpaceTree(spaceId + '')
    const me = await this.getMe()
    if (!me) return

    const myId = me.id
    // const t0 = performance.now()

    const todoTaskMap = this.service.getTodoTasks(spaceTree, [myId])

    let todos: TaskTreeViewData[] = []
    Object.keys(todoTaskMap).map((key) => {
      const item = {
        label: key,
        tasks: todoTaskMap[key],
      }
      todos.push(item)
    })
    console.log({ spaceTree })

    const _allTasks = [
      ...spaceTree.folders,
      {
        name: 'Root',
        lists: [...spaceTree.root_lists],
      },
    ]

    const flatAllTasks: any = []
    _allTasks.forEach((item) => {
      item.lists.forEach((list) => {
        flatAllTasks.push({
          label: `${item.name}/${list.name}`,
          tasks: list.tasks,
        })
      })
    })
    // console.log({ todos })

    this.tree = window.createTreeView('clickup-tasks', {
      treeDataProvider: new TreeViewDataProvider.TaskTreeView([
        {
          label: 'To Do',
          items: todos,
        },
        {
          label: 'All Tasks',
          items: flatAllTasks,
        },
      ]),
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
    // window.createTreeView(EnumTreeView.AllTasks, {
    //   treeDataProvider: new TreeViewDataProvider.TaskTreeView(flatAllTasks),
    //   showCollapseAll: false,
    // })

    this.stateUpdateSpaceList(spaceTree)
    this.stateUpdateSpace(spaceTree)
    this.setIsLoading(false)
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

  // API handler
  async createNewTask(listId: string, data: ApiNewTaskSchema) {
    try {
      this.setIsLoading(true)
      console.log({ data })
      const resp = await this.service.newTask(listId, data)
      console.log({ resp })
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

  stateUpdateSpace(space: SpaceLListFile) {
    AppState.crntSpace = space
    const crntSpace = {
      id: space.id,
      name: space.name,
    }
    this.storage.setValue(EnumLocalStorage.CrntSpace, crntSpace)
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
