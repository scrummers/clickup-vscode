import * as vscode from 'vscode'
import { Client } from './clients/Client'
import { registerCommands } from './commands'
import { CodelensProvider } from './service/CodelensProvider'
import { StatusBarService } from './service/status_bar_service'

let disposables: vscode.Disposable[] = [];

async function activate(context: vscode.ExtensionContext) {
  // Initialization
  const client = new Client(context)
  // const clickUpService = client.service
  const codelensProvider = new CodelensProvider();
  new StatusBarService()
  vscode.languages.registerCodeLensProvider("*", codelensProvider);
  // Command function
  registerCommands(context, client)


  /** WEBVIEW */
  // vscode.commands.registerCommand(Commands.ClickupViewTask, async () => {
  //   ViewLoader.showWebview(context);
  // })
  // context.subscriptions.push(disposable);

  // vscode.commands.registerCommand("clickup.codelentest", () => {
  //   codelensProvider.codeLensDisable()
  // })

  // vscode.commands.registerCommand('clickup.testing', async (args: any) => {
  //   // For testing purposes and examples for each features
  //   const clickUpService_debug = client.service
  //   const space = await clickUpService_debug.getSpaceTree('55543351')
  //   console.log(space)
  //   const TestSpace = await clickUpService_debug.getSpaceTree('55594352')
  //   console.log(TestSpace)
  //   const ALL_tasks = await clickUpService_debug.getTasksFilters([], TestSpace, EnumTodoLabel.allTask) // Return ALL To-do Task
  //   const tasks = await clickUpService_debug.getTasksFilters([49541582], TestSpace, EnumTodoLabel.allTask) // Return Wilson To-do Task
  //   const Jtasks = await clickUpService_debug.getTasksFilters([5883240], TestSpace, EnumTodoLabel.allTask) // Return Jacky To-do Task
  //   const ALL_tasks_sp = await clickUpService_debug.getTasksFilters([], space, EnumTodoLabel.allTask) // Return ALL To-do Task
  //   const done_tasks = await clickUpService_debug.getTasksFilters([], space, 'done') // Return done Task
  //   const overdue_tasks = await clickUpService_debug.getTasksFilters([], TestSpace, EnumTodoLabel.overdue) // Return overdue Task
  //   const today_tasks = await clickUpService_debug.getTasksFilters([], TestSpace, EnumTodoLabel.today) // Return overdue Task
  //   const join_tasks = await clickUpService_debug.getTasksFilters([49541582, 5883240], TestSpace, EnumTodoLabel.allTask) // Return next Task
  //   //await clickUpService_debug.createList('55594352', 'Create_list_from_VS');
  //   //Example
  //   //const data8= {
  //   //  name: "From VS Code testing 8 name ",
  //   //  description:"From VS Code testing 99 description"
  //   // }
  //   //await clickUpService_debug.newTask("217581024", data8)
  //   console.log(ALL_tasks)
  //   console.log(tasks)
  //   console.log(Jtasks)
  //   console.log(ALL_tasks_sp)
  //   console.log(done_tasks)
  //   console.log(overdue_tasks)
  // })

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
