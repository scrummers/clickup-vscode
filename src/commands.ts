import { commands, DebugConsoleMode, ExtensionContext, window } from 'vscode'
import { Client } from './clients/Client'
import { LocalStorageService } from './service/local_storage_service'
import { AppState } from './store'

export enum Commands {
  // temp
  ClickupGetStorageData = 'clickup.getStorageData',

  ClickupGetMyData = 'clickup.getMyData',
  // Config
  ClickupSetToken = 'clickup.setToken',
  ClickupUpdateToken = 'clickup.updateToken',
  ClickupDeleteToken = 'clickup.deleteToken',

  // Task
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
