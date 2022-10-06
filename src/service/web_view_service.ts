import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";

class WebViewService{
  private panel: vscode.WebviewPanel;

  /**
   * @param context vscode.ExtensionContext
   * @param webPath string[] - path to HTML file
   * @param webTitle string
   * @param optional Object
   *                  -> localResources: Uri[] - Uri to HTML resources files
   *                  -> receiveMessageFunction: (...args: any[]) => void
   */
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

        return await vscode.window.showErrorMessage("Something wrong...", ...["Reload ?"]).then((result) => {
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

  /**
   * @param receiveMessageFunction (...args: any[]) => void
   */
  public setReceiveMessageFunction(receiveMessageFunction: (...args: []) => void): void {
    this.panel.webview.onDidReceiveMessage(receiveMessageFunction);
  }

  /**
   * @param message JSON
   */
  public postMessage(message: JSON): void {
    this.panel.webview.postMessage(message);
  }
}

export { WebViewService };