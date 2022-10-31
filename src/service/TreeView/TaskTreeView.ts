import * as vscode from 'vscode'
import { Task, TaskTreeViewData } from '../../util/typings/clickup'

export class TaskTreeView implements vscode.TreeDataProvider<TaskItem> {
  private data: TaskItem[]
  private m_onDidChangeTreeData: vscode.EventEmitter<TaskItem | undefined> = new vscode.EventEmitter<
    TaskItem | undefined
  >()
  // and vscode will access the event by using a readonly onDidChangeTreeData (this member has to be named like here, otherwise vscode doesnt update our treeview.
  readonly onDidChangeTreeData?: vscode.Event<TaskItem | undefined> = this.m_onDidChangeTreeData.event

  constructor(todoTasks: TaskTreeViewData) {
    this.data = todoTasks.map((t) => new TaskItem(t.label, t.tasks))
    console.log(this.data)
  }

  getTreeItem(element: TaskItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: TaskItem): vscode.ProviderResult<TaskItem[]> {
    if (element === undefined) {
      console.log('undefined')
      return this.data
    } else {
      console.log('el tasks')
      return element.tasks
    }
  }

  public itemClicked(item: TaskItem) {
    console.log(item)
  }

  public refresh() {
    console.log('refresh')
  }
}

class TaskItem extends vscode.TreeItem {
  public tasks: TaskItem[] = []

  constructor(
    public readonly label: string,
    private _tasks: Task[] | Task // public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed)

    if (Array.isArray(this._tasks)) {
      this.tasks = (_tasks as Task[]).map((_t) => new TaskItem(_t.name, _t))
      this.description = `(${this._tasks.length})`
      return
    }
    const t = _tasks as Task
    this.tooltip = `${this.label}-${t.due_date}`
    this.description = t.status.status.toUpperCase()
    this.collapsibleState = vscode.TreeItemCollapsibleState.None
  }

  public add_child(child: TaskItem) {
    // this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    // this.children.push(child);
  }

  // iconPath = {
  //   light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
  //   dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg'),
  // }
}
