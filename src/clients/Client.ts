import { commands, ExtensionContext, window } from 'vscode'
import { Commands } from '../commands'
import { ClickUpService } from '../service/click_up_service'
import { LocalStorageService } from '../service/local_storage_service'
import { EnumTreeView, TreeViewDataProvider } from '../service/TreeView'
import { AppState, appStateChangeEventEmitter } from '../store'
import { EnumTodoLabel, SpaceLListFile, Teams, User } from '../util/typings/clickup'
import { EnumLocalStorage } from '../util/typings/system'

let instance: Client | null = null

export class Client {
  public service!: ClickUpService
  private storage!: LocalStorageService

  constructor(context?: ExtensionContext) {
    if (instance) {
      return instance
    }

    instance = this

    if (!context) {
      return
    }

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
        const service = new ClickUpService(this.storage)
        const me = await service.setup(token)
        this.service = service

        // init space environment
        const crntSpace = this.storage.getValue(EnumLocalStorage.CrntSpace) as {
          name: string
          id: string
        }
        if (!crntSpace) {
          commands.executeCommand(Commands.ClickupSelectWorkspace)
        }

        console.log(`[debug]: loading space ${crntSpace.name} #${crntSpace.id}`)

        this.setupTreeView(crntSpace.id)
        // update state
        resolve(me)
      } catch (err) {
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
    const todos: any = [
      {
        label: EnumTodoLabel.today,
        tasks: await this.service.getTasksFilters([myId], spaceTree, 'today'),
      },
      {
        label: EnumTodoLabel.overdue,
        tasks: await this.service.getTasksFilters([myId], spaceTree, 'overdue'),
      },
      {
        label: EnumTodoLabel.next,
        tasks: await this.service.getTasksFilters([myId], spaceTree, 'next'),
      },
      {
        label: EnumTodoLabel.noDueDate,
        tasks: await this.service.getTasksFilters([myId], spaceTree, 'no_due'),
      },
    ]

    // const allTasks = await this.service.getTasksFilters([me.id], spaceTree, '*')
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

    window.createTreeView(EnumTreeView.Todo, {
      treeDataProvider: new TreeViewDataProvider.TaskTreeView(todos),
      showCollapseAll: false,
    })
    window.createTreeView(EnumTreeView.AllTasks, {
      treeDataProvider: new TreeViewDataProvider.TaskTreeView(flatAllTasks),
      showCollapseAll: false,
    })

    this.stateUpdateSpace(spaceTree)
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

  // remove all data once token is deleted
  deleteToken() {
    this.storage.clearAll()
    AppState.crntSpace = null
    AppState.me = null
    appStateChangeEventEmitter.fire()
  }

  // App state related
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
