import * as vscode from 'vscode';
import * as path from 'path';

export class ViewLoader {
  public static currentPanel?: vscode.WebviewPanel;

  private panel: vscode.WebviewPanel;
  private context: vscode.ExtensionContext;
  private disposables: vscode.Disposable[];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.disposables = [];
    console.log('constructing view loader')

    this.panel = vscode.window.createWebviewPanel('clickup', 'ClickUp', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'out', 'app'))],
    });

    // render webview
    this.renderWebview();

    // listen messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        console.log('msg', message);
      },
      null,
      this.disposables
    );

    this.panel.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      this.disposables
    );
  }

  private renderWebview() {
    const html = this.render();
    this.panel.webview.html = html;
  }

  static showWebview(context: vscode.ExtensionContext) {
    const cls = this;
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (cls.currentPanel) {
      cls.currentPanel.reveal(column);
    } else {
      cls.currentPanel = new cls(context).panel;
    }
  }

  static postMessageToWebview(message: any) {
    // post message from extension to webview
    const cls = this;
    cls.currentPanel?.webview.postMessage(message);
  }

  public dispose() {
    ViewLoader.currentPanel = undefined;

    // Clean up our resources
    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  render() {
    const bundleScriptPath = this.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'out', 'app', 'bundle.js'))
    );

    return `
      <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>React App</title>
        </head>
    
        <body>
          <div id="root"></div>
          <script src="${bundleScriptPath}"></script>
        </body>
      </html>
    `;
  }
}