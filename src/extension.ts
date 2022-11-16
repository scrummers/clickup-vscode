import * as path from 'path'
import * as vscode from 'vscode'
import { Client } from './clients/Client'
import { Commands, registerCommands } from './commands'
import { WebViewService } from './service/web_view_service'
import { EnumTodoLabel } from './util/typings/clickup'
import { CodelensProvider } from './service/CodelensProvider';
import { StatusBarService } from './service/status_bar_service'

let disposables: vscode.Disposable[] = [];

async function activate(context: vscode.ExtensionContext) {
  // Initialization
  const client = new Client(context)
  const clickUpService = client.service
  const codelensProvider = new CodelensProvider();
  const stausbarService = new StatusBarService()
  vscode.languages.registerCodeLensProvider("*", codelensProvider);
  // Command function
  registerCommands(context, client)

  // vscode.commands.registerCommand('clickup.deleteClickUpToken', async () => {
  //   await vscode.window
  //     .showInformationMessage('Do you really want to delete your token?', ...['Yes', 'No'])
  //     .then((result) => {
  //       if (result === undefined || result === 'No') {
  //         return
  //       }

  //       clickUpService.deleteUserToken()
  //     })
  // })

  // vscode.commands.registerCommand('clickup.editClickUpToken', async () => {
  //   await vscode.window
  //     .showInputBox({
  //       placeHolder: 'Please input a new user token',
  //     })
  //     .then((userToken) => clickUpService.setUserToken(userToken))
  // })

  vscode.commands.registerCommand(Commands.ClickupAddTask, async () => {
    // if (clickUpService.userToken === undefined) {
    //   return vscode.window.showErrorMessage('Please input your Click Up token to use Scrummer')
    // }

    let webFolder: string = 'add_new_task'

    let addTaskWebViewer = new WebViewService(context, [webFolder, 'add_new_task.html'], 'Add New Task', {
      localResources: [webFolder],
      receiveMessageFunction: (message) => {
        console.log(message)
      },
    })
  })

  vscode.commands.registerCommand(Commands.ClickupDeleteTask, () => {
    vscode.window.showInformationMessage('Deleting Task...')
  })

  vscode.commands.registerCommand(Commands.ClickupEditTask, () => {
    // if (clickUpService.userToken === undefined) {
    //   return vscode.window.showErrorMessage('Please input your Click Up token to use Scrummer')
    // }

    let webFolder: string = 'edit_task'

    let editTaskWebViewer = new WebViewService(context, [webFolder, 'edit_task.html'], 'Edit Task', {
      localResources: [webFolder],
      receiveMessageFunction: (message) => {
        console.log(message)
      },
    })
  })

  vscode.commands.registerCommand("clickup.codelentest", () => {
    codelensProvider.codeLensDisable()
  })

  vscode.commands.registerCommand('clickup.testing', async (args: any) => {
    // For testing purposes and examples for each features
    const clickUpService_debug = client.service
    const space = await clickUpService_debug.getSpaceTree('55543351')
    console.log(space)
    const TestSpace = await clickUpService_debug.getSpaceTree('55594352')
    console.log(TestSpace)
    const ALL_tasks = await clickUpService_debug.getTasksFilters([], TestSpace, EnumTodoLabel.allTask) // Return ALL To-do Task
    const tasks = await clickUpService_debug.getTasksFilters([49541582], TestSpace, EnumTodoLabel.allTask) // Return Wilson To-do Task
    const Jtasks = await clickUpService_debug.getTasksFilters([5883240], TestSpace, EnumTodoLabel.allTask) // Return Jacky To-do Task
    const ALL_tasks_sp = await clickUpService_debug.getTasksFilters([], space, EnumTodoLabel.allTask) // Return ALL To-do Task
    const done_tasks = await clickUpService_debug.getTasksFilters([], space, 'done') // Return done Task
    const overdue_tasks = await clickUpService_debug.getTasksFilters([], TestSpace, EnumTodoLabel.overdue) // Return overdue Task
    const today_tasks = await clickUpService_debug.getTasksFilters([], TestSpace, EnumTodoLabel.today) // Return overdue Task
    const join_tasks = await clickUpService_debug.getTasksFilters([49541582, 5883240], TestSpace, EnumTodoLabel.allTask) // Return next Task
    //await clickUpService_debug.createList('55594352', 'Create_list_from_VS');
    //Example
    //const data8= {
    //  name: "From VS Code testing 8 name ",
    //  description:"From VS Code testing 99 description"
    // }
    //await clickUpService_debug.newTask("217581024", data8)
    console.log(ALL_tasks)
    console.log(tasks)
    console.log(Jtasks)
    console.log(ALL_tasks_sp)
    console.log(done_tasks)
    console.log(overdue_tasks)
  })

  if (!client.isTokenExist()) {
    console.log("[ClickUp] First Launch")
    vscode.commands.executeCommand("workbench.action.openWalkthrough", "scrummer.scrummer#quickStart")
  }
}

function deactivate() {
  if (disposables) {
    disposables.forEach(item => item.dispose());
  }
  disposables = [];
}

export { activate, deactivate }
