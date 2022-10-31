import { commands, ExtensionContext, window } from 'vscode'
import { Commands } from '../commands'
import { ClickUpService } from '../service/click_up_service'
import { LocalStorageService } from '../service/local_storage_service'
import { EnumTreeView, TreeViewDataProvider } from '../service/TreeView'
import { AppState } from '../store'
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

    this.init(context)
  }

  private async init(context: ExtensionContext) {
    try {
      this.storage = new LocalStorageService(context.workspaceState)

      const token = await this.storage.getValue(EnumLocalStorage.Token)
      if (!token) {
        window.showWarningMessage('Please enter a valid user token!')
        commands.executeCommand(Commands.ClickupSetToken)
        return
      }

      const service = await new ClickUpService(this.storage)
      service.setup(token)
      this.service = service

      // init space environment
      const crntSpace = await this.storage.getObjectValue(EnumLocalStorage.CrntSpace)
      // const me = await this.storage.getObjectValue(EnumLocalStorage.Me)
      if (!crntSpace) {
        commands.executeCommand(Commands.ClickupSelectWorkspace)
        return
      }
      // if (!me) {
      //   commands.executeCommand(Commands.ClickupGetMyData)
      //   return
      // }
      console.log(`[debug]: loading space ${crntSpace.name} #${crntSpace.id}`)

      this.setupTreeView(crntSpace.id)
      // update state
    } catch (err) {
      console.log('err', err)
    }
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
    const me = await this.storage.getObjectValue(EnumLocalStorage.Me)
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

  // App state related
  stateUpdateSpace(space: SpaceLListFile) {
    AppState.crntSpace = space
    const crntSpace = {
      id: space.id,
      name: space.name,
    }
    this.storage.setObjectValue(EnumLocalStorage.CrntSpace, crntSpace)
  }
  stateUpdateMe(user: User) {
    AppState.me = user
    this.storage.setObjectValue(EnumLocalStorage.Me, user)
  }

  static destory() {
    instance = null
  }
}
