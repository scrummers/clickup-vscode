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

  if (!client.isTokenExist()) {
    // console.log("[ClickUp] First Launch")
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
