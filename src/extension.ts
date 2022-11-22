import * as vscode from 'vscode'
import { Client } from './clients/Client'

let disposables: vscode.Disposable[] = [];

async function activate(context: vscode.ExtensionContext) {
  // Initialization
  new Client(context)
}

function deactivate() {
  if (disposables) {
    disposables.forEach(item => item.dispose());
  }
  disposables = [];
}

export { activate, deactivate }
