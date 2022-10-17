import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";

/**
 * Type for WebViewService postMessage()
 */
type WebJSON = {
  command: string,
  data: object
};

class WebViewService{
  private panel: vscode.WebviewPanel;

  /**
   * Constructor of WebViewService
   * @param context vscode.ExtensionContext
   * @param webPath string[] - path to HTML file
   * @param webTitle string
   * @param optional Object
   *                  -> @param localResources Uri[] - Uri to HTML resources files
   *                  -> @param receiveMessageFunction (...args: any[]) => void
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

      if(optional) {
        this.panel.webview.html = this.getWebViewContent(data.toString(), {
          styleUri: vscode.Uri.file(path.join(...[context.extensionPath].concat(webPath.slice(0, -1)), "style.css")),
          scriptUri: vscode.Uri.file(path.join(...[context.extensionPath].concat(webPath.slice(0, -1)), "script.js"))
        });
      }
      else { this.panel.webview.html = this.getWebViewContent(data.toString()); }
    });

    // Attach receiveMessageFunction
    if(optional?.receiveMessageFunction) { this.panel.webview.onDidReceiveMessage(optional.receiveMessageFunction); }

    // Dispose Function
    this.panel.onDidDispose(() => {
      console.log(`${webTitle} onDidDispose`)
    }, null, context.subscriptions);
  }

  // Private Functions
  /**
   *
   * @param template String - Original HTML
   * @param uri Object - Uri to the local resources
   *              -> @param styleUri Uri - Uri to style.css
   *              -> @param scriptUri Uri - Uri to script.js
   * @returns string - Rendered HTML
   */
  private getWebViewContent(template: string, uri?: {
    styleUri: Uri,
    scriptUri: Uri
  }): string {
    if(uri) {
      // The following variables is for template string, i.e. eval()
      // Please don't remove it
      let style: Uri = this.panel.webview.asWebviewUri(uri.styleUri);
      let script: Uri = this.panel.webview.asWebviewUri(uri.scriptUri);

      return eval('`' + template + '`');
    }

    return template;
  }

  // Public Functions
  /**
   * Set function to handle message when received from HTML
   * @param receiveMessageFunction (...args: any[]) => void
   */
  public setReceiveMessageFunction(receiveMessageFunction: (...args: []) => void): void {
    this.panel.webview.onDidReceiveMessage(receiveMessageFunction);
  }

  /**
   * Post message to HTML
   * @param message WebJSON
   */
  public postMessage(message: WebJSON): void {
    this.panel.webview.postMessage(message);
  }
}

export { WebViewService };