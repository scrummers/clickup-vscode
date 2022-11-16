import { commands, DebugConsoleMode, ExtensionContext, window } from 'vscode'
import { Client } from './clients/Client'
import { LocalStorageService } from './service/local_storage_service'
import { AppState } from './store'
import { INIT } from './util/const'
import { ApiNewTaskSchema } from './util/typings/clickup'

export enum Commands {
  // temp
  ClickupGetStorageData = 'clickup.getStorageData',

  ClickupGetMyData = 'clickup.getMyData',
  // Config
  ClickupSetToken = 'clickup.setToken',
  ClickupUpdateToken = 'clickup.updateToken',
  ClickupDeleteToken = 'clickup.deleteToken',

  // Task
  ClickupQuickAddTask = 'clickup.quickAddTask',

  ClickupAddTask = 'clickup.addTask',
  ClickupEditTask = 'clickup.editTask',
  ClickupDeleteTask = 'clickup.deleteTask',

  // Workspace
  ClickupSelectWorkspace = 'clickup.selectWorkspace',

  // System
  GetAppState = 'clickup.getAppState',
}

export function registerCommands(vscodeContext: ExtensionContext, client: Client) {
  vscodeContext.subscriptions.push(
    commands.registerCommand(Commands.ClickupQuickAddTask, async () => {
      try {
        const spaceList = AppState.spaceList
        if (!spaceList || spaceList.length === 0) {
          throw new Error('Please create a list first')
        }
        const options = spaceList.map((l) => ({
          label: l.label,
          id: l.id,
          // detail: l.id,
        }))
        const selectedList = await window.showQuickPick(options, {
          matchOnDetail: true,
        })

        if (!selectedList) {
          throw new Error('Please select a list')
        }
        const taskInput = await window.showInputBox({
          placeHolder: 'Enter task name',
        })

        if (!taskInput) {
          throw new Error('Please enter a task name')
        }
        const data: ApiNewTaskSchema = {
          ...INIT.newTask,
          name: taskInput,
          description: 'new task ddesc',
          priority: 2,
          status: 'to do',
          start_date: Date.now(),
          due_date: Date.now() + 1000000,
          time_estimate: 8640000,
        }
        const resp = await client.createNewTask(selectedList.id, data)
        console.log({ resp })
        const message = `
          ### Task Creation success!
          Task: ${resp.name} \n
          List: ${selectedList.label} \n
          Description: ${resp.description} 
        `

        // TODO: reload tree view
        const action = await window.showInformationMessage(message, ...['Open Task', 'OK'])
        console.log({ action })
      } catch (err) {
        console.error(err)
        window.showErrorMessage('Something error')
      }

    }),
    commands.registerCommand(Commands.ClickupSetToken, async () => {
      await window
        .showInputBox({
          placeHolder: 'Please enter your ClickUp API token',
        })
        .then(async (token) => {
          if (token) {
            try {
              await client.setToken(token)
              window.showInformationMessage('API token register succeed')
            } catch (err) {
              window.showErrorMessage('API token error')
            }
          }
        })
    }),
    commands.registerCommand(Commands.ClickupDeleteToken, async () => {
      if (!client.isTokenExist()) {
        window.showErrorMessage('Token has not been set')
        return
      }

      await window
        .showInformationMessage('Do you really want to delete your token?', ...['Yes', 'No'])
        .then(async (result) => {
          if (result === undefined || result === 'No') {
            return
          }
          client.deleteToken()
          window.showInformationMessage('Clickup API token is deleted')
        })
    }),
    commands.registerCommand(Commands.ClickupUpdateToken, async () => {
      if (!client.isTokenExist()) {
        window.showErrorMessage('Token has not been set')
        return
      }

      await window
        .showInputBox({
          placeHolder: 'Please enter your ClickUp API token',
        })
        .then(async (token) => {
          if (token) {
            try {
              // remove old data
              client.deleteToken()

              //TODO: should verify whether the new token is valid, otherwise reverse it

              await client.setToken(token)
              window.showInformationMessage('API token update succeed')
            } catch (err) {
              window.showErrorMessage('API token error')
            }
          }
        })
    }),

    commands.registerCommand(Commands.GetAppState, async () => {
      console.log(JSON.stringify(AppState, null, 4))
    }),
    commands.registerCommand(Commands.ClickupGetStorageData, async () => {
      const storage = new LocalStorageService(vscodeContext.workspaceState)
      const token = await storage.getValue('token')
    }),
    // commands.registerCommand(Commands.ClickupGetMyData, async () => {
    //   const me = await client.service.getMe()

    // }),
    commands.registerCommand(Commands.ClickupSelectWorkspace, async () => {
      try {
        const workspaces = await client.service.getTeams()
        const options = workspaces.map((ws) => ({
          label: ws.name,
          id: ws.id,
          description: `#${ws.id}, Teams: ${ws.members.length} `,
        }))

        const slctWorkspace = await window.showQuickPick(options, {
          matchOnDetail: true,
          title: 'Select Workspace',
          // onDidSelectItem: (item) => console.log('selected', item),
        })

        if (!slctWorkspace) return

        // get spaces by team's id
        const spaces = await client.service.getSpaces(slctWorkspace.id)
        const spacesOptions = spaces.map((sp) => ({
          label: sp.name,
          id: sp.id,
          description: sp.private ? 'Private' : 'Public',
        }))
        const slctSpace = await window.showQuickPick(spacesOptions, {
          matchOnDetail: true,
        })

        if (!slctSpace) return

        client.setupTreeView(slctSpace.id)
      } catch (err) {
        //TODO:
        console.log('error', err)
      }
    })
  )
}
