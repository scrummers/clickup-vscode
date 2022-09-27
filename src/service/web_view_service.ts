import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

class WebViewService{
  private htmlFile: string;
  private panel: vscode.WebviewPanel;

  constructor(context: vscode.ExtensionContext, webPath: string[], receiveMessageFunction: (...args: any[]) => void) {
    this.htmlFile = path.join(...[context.extensionPath].concat(webPath));

    this.panel = vscode.window.createWebviewPanel(
      "Scrummer.webPanel",
      "Add new task",
      vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );

    fs.readFile(this.htmlFile, async (error, data) => {
      if (error) {
        console.error(error);

        let result: string | undefined = await vscode.window.showErrorMessage("Something wrong happen...", ...["Reload ?"]).then((result) => result);

        if (result === undefined) { return; }

        vscode.commands.executeCommand("workbench.action.reloadWindow");
      }

      this.panel.webview.html = data.toString();
    });

    this.panel.webview.onDidReceiveMessage(receiveMessageFunction);
  }
}

export { WebViewService };