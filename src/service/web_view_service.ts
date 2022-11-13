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
  private pathToDistHTML: string;

  /**
   * Constructor of WebViewService
   * @param context vscode.ExtensionContext
   * @param webPath string[] - relative path to HTML file
   * @param webTitle string
   * @param optional Object
   *                  -> @param localResources Uri[] - Uri to HTML resources files, e.g. style.css, script.js
   *                  -> @param receiveMessageFunction (...args: any[]) => void - Function to handle message from the web view
   */
  constructor(context: vscode.ExtensionContext, webPath: string[], webTitle: string, optional?: {
    localResources?: string[],
    receiveMessageFunction?: (...args: any[]) => void
  }) {
    this.pathToDistHTML = path.join(...[context.extensionPath].concat(["dist", "html"]))

    console.log(this.pathToDistHTML)
    console.log(webPath)
    console.log(path.join(...[this.pathToDistHTML].concat(webPath)))

    let viewColumn = vscode.window.activeTextEditor ?
      vscode.window.activeTextEditor.viewColumn : undefined;
    let htmlResources = [vscode.Uri.file(path.join(this.pathToDistHTML, "style"))]

    // Create webview panel
    this.panel = vscode.window.createWebviewPanel("clickup-vscode.webPanel", webTitle,
      viewColumn ?
        viewColumn : vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: optional?.localResources ?
          htmlResources.concat(optional.localResources.map((lr) => vscode.Uri.file(path.join(this.pathToDistHTML, lr)))) : htmlResources
      }
    );

    // Load HTML file to the web panel
    fs.readFile(path.join(...[this.pathToDistHTML].concat(webPath)), async (error, data) => {
      if(error) {
        console.error(error);

        return await vscode.window.showErrorMessage("Something wrong...", ...["Reload ?"]).then((result) => {
          if(result === undefined) { return; }

          vscode.commands.executeCommand("workbench.action.reloadWindow");
        });
      }

      this.panel.webview.html = this.getWebViewContent(data.toString(), {
        styleUri: vscode.Uri.file(path.join(...[this.pathToDistHTML].concat(webPath.slice(0, -1)), "style.css")),
        scriptUri: vscode.Uri.file(path.join(...[this.pathToDistHTML].concat(webPath.slice(0, -1)), "script.js"))
      });
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
   * Return the evaluated HTML content
   * @param template String - Original HTML
   * @param uri Object - Uri to the local resources
   *              -> @param styleUri Uri - Uri to style.css
   *              -> @param scriptUri Uri - Uri to script.js
   * @returns string - Rendered HTML
   */
  private getWebViewContent(template: string, uri: {
    styleUri: Uri,
    scriptUri: Uri
  }): string {
      // The following variables is for template string, i.e. eval()
      // Please don't remove it
    let mainStyle: Uri = this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.pathToDistHTML, "style", "main_style.css")));
    let style: Uri = this.panel.webview.asWebviewUri(uri.styleUri);
    let script: Uri = this.panel.webview.asWebviewUri(uri.scriptUri);

      return eval('`' + template + '`');
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