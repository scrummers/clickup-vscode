import * as vscode from 'vscode';
import * as path from 'path';
import { Message, EnumMessageType } from '../../util/typings/message';
import { Client } from '../../clients/Client';
import { EnumInitWebRoute } from '../../util/typings/system';
import { ApiNewTaskSchema, ApiUpdateTaskSchema, Task } from '../../util/typings/clickup';
import { Commands } from '../../commands';
import { Delete } from '@mui/icons-material';

export class ViewLoader {
  public static currentPanel?: vscode.WebviewPanel;

  private client!: Client
  private initData: any
  private initRoute?: EnumInitWebRoute
  private panel: vscode.WebviewPanel;
  private context: vscode.ExtensionContext;
  private disposables: vscode.Disposable[];

  constructor(context: vscode.ExtensionContext, initRoute?: EnumInitWebRoute, initData?: any) {
    this.context = context;
    this.disposables = [];
    this.initRoute = initRoute
    this.initData = initData
    this.client = new Client()

    this.panel = vscode.window.createWebviewPanel('clickup', 'ClickUp', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'out', 'app'))],
    });

    // render webview
    this.renderWebview();

    // listen messages from webview
    this.panel.webview.onDidReceiveMessage(
      async (message: Message) => {
        const text = message.payload
        switch (message.type) {
          case EnumMessageType.Reload:
            vscode.commands.executeCommand('workbench.action.webview.reloadWebviewAction');
            ViewLoader.postMessageToWebview(EnumMessageType.Init, this.initData)
            break
          case EnumMessageType.Close:
            ViewLoader.currentPanel?.dispose()
            break
          case EnumMessageType.Delete:
            try {
              if (!text) return

              await await this.client.deleteTask(text)

              vscode.window.showInformationMessage(`Delete Task Success`);
              vscode.commands.executeCommand(Commands.ClickupRefresh)
              ViewLoader.currentPanel?.dispose()
            } catch (err) {
              ViewLoader.postMessageToWebview(EnumMessageType.Delete, {
                success: false
              })
              vscode.window.showInformationMessage(`Unable to delete task`);
            }

            ViewLoader.currentPanel?.dispose()
            break
          case EnumMessageType.Update:
            try {
              if (!text) return
              const oldTask: Task = this.initData!.task
              const newTask: Task = JSON.parse(text)

              const newTags = newTask.tags.map((t) => t.name)

              const add: number[] = []
              const rem: number[] = []
              newTask.assignees.forEach((a) => {
                if (oldTask.assignees.length === 0) {
                  add.push(a.id)
                  return
                }
                if (!oldTask.assignees.map((oa) => oa.id).includes(a.id)) {
                  add.push(a.id)
                }
              })
              oldTask.assignees.forEach((a) => {
                if (newTask.assignees.length === 0) {
                  rem.push(a.id)
                  return
                }
                if (!oldTask.assignees.map((oa) => oa.id).includes(a.id)) {
                  rem.push(a.id)
                }
              })
              const data: ApiUpdateTaskSchema = {
                name: newTask.name,
                description: newTask.description,
                priority: newTask.priority ? +newTask.priority.id : null,
                due_date: newTask.due_date ? +newTask.due_date : null,
                due_date_time: true,
                time_estimate: newTask.time_estimate ? +newTask.time_estimate : null,
                start_date: newTask.start_date ? +newTask.start_date : null,
                start_date_time: true,
                parent: newTask.parent,
                archived: newTask.archived,
                assignees: {
                  add,
                  rem
                },
                status: newTask.status.status,
              }

              await this.client.updateTask(newTask.id, data)

              await this.client.updateTaskTags(newTask.list.id, newTask.id, newTags)

              ViewLoader.postMessageToWebview(EnumMessageType.Update, {
                success: true
              })

              vscode.commands.executeCommand(Commands.ClickupRefresh)
              vscode.window.showInformationMessage(`Update Task Success`);
            } catch (err) {
              vscode.window.showInformationMessage(`Unable to update Task`);
              ViewLoader.postMessageToWebview(EnumMessageType.Update, {
                success: false
              })
            }
            break
          case EnumMessageType.Create:
            try {
              if (!text) return
              const newTask: Task & { listId: string } = JSON.parse(text)
              // console.log({ newTask })

              const data: ApiNewTaskSchema = {
                name: newTask.name,
                description: newTask.description,
                status: newTask.status.status,
                priority: newTask.priority ? +newTask.priority.id : null,

                due_date: newTask.due_date ? +newTask.due_date : null,
                due_date_time: true,
                time_estimate: newTask.time_estimate ? +newTask.time_estimate : null,
                start_date: newTask.start_date ? +newTask.start_date : null,
                start_date_time: true,

                parent: newTask.parent,
                // archived: newTask.archived,
                notify_all: false,
                assignees: newTask.assignees.map((a) => a.id),
                tags: newTask.tags.map((t) => t.name)
              }

              await this.client.createNewTask(newTask.listId, data)
              ViewLoader.postMessageToWebview(EnumMessageType.Common, {
                success: true
              })

              vscode.commands.executeCommand(Commands.ClickupRefresh)
              vscode.window.showInformationMessage(`Create Task Success`);
            } catch (err) {
              ViewLoader.postMessageToWebview(EnumMessageType.Common, {
                success: false
              })
            }
            break
        }
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

    setTimeout(() => {
      ViewLoader.postMessageToWebview(EnumMessageType.Init, this.initData)
    }, 200)
  }

  static showWebview(context: vscode.ExtensionContext, initRoute?: EnumInitWebRoute, initData?: any) {
    const cls = this;
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (cls.currentPanel) {
      cls.currentPanel.reveal(column);
    } else {
      cls.currentPanel = new cls(context, initRoute, initData).panel;
    }
  }

  static postMessageToWebview(type: EnumMessageType, payload?: any) {
    // post message from extension to webview
    const cls = this;
    const message = {
      type,
      ...(payload && { payload: JSON.stringify(payload) })
    }
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
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
          />
          <title>ClickUp</title>
        </head>
    
        <body>
          <div id="root"></div>
          <script>
            const vscode = acquireVsCodeApi();
            const initRoute = '${this.initRoute}';
          </script>
          <script src="${bundleScriptPath}"></script>
        </body>
      </html>
    `;
  }
}