import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";

class WebViewService{
  private panel: vscode.WebviewPanel;

  constructor(context: vscode.ExtensionContext, webPath: string[], webTitle: string, optional?: {
    localResources?: Uri[],
    receiveMessageFunction?: (...args: any[]) => void
  }) {
    const viewColumn = vscode.window.activeTextEditor ?
      vscode.window.activeTextEditor.viewColumn : undefined

    // Create webview panel
    this.panel = vscode.window.createWebviewPanel(
      "Scrummer.webPanel",
      webTitle,
      viewColumn ?
        viewColumn : vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: optional?.localResources ?
          optional.localResources : []
      }
    );

    // Load HTML file to the web panel
    fs.readFile(path.join(...[context.extensionPath].concat(webPath)), async (error, data) => {
      if(error) {
        console.error(error);

        return await vscode.window.showErrorMessage("Something wrong happen...", ...["Reload ?"]).then((result) => {
          if(result === undefined) { return; }

          vscode.commands.executeCommand("workbench.action.reloadWindow");
        });
      }

      this.panel.webview.html = data.toString();
    });

    if(optional?.receiveMessageFunction) { this.panel.webview.onDidReceiveMessage(optional.receiveMessageFunction); }

    this.panel.onDidDispose(() => {
      console.log(`${webTitle} onDidDispose`)
    }, null, context.subscriptions);
  }

  public setReceiveMessageFunction(receiveMessageFunction: (...args: []) => void) {
    this.panel.webview.onDidReceiveMessage(receiveMessageFunction);
  }

  public postMessage(message: JSON) {
    this.panel.webview.postMessage(message);
  }
}

export { WebViewService };