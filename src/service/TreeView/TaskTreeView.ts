import * as vscode from 'vscode'
import { EnumTreeLevel, Task, TaskTreeViewData } from '../../util/typings/clickup'
import { getDate, getIcon } from '../../util/helper'
import { Commands } from '../../commands'
import path = require('path')
import { AppState } from '../../store'

type TaskData = {
  label: string,
  // level: EnumTreeLevel
  // level: 'top'
  items: TaskTreeViewData[]
}

export class TaskTreeView implements vscode.TreeDataProvider<TaskItem> {
  // private taskData: TaskData[]
  private data: TaskItem[]
  private event_emitter: vscode.EventEmitter<TaskItem | undefined> = new vscode.EventEmitter<TaskItem | undefined>();
  private m_onDidChangeTreeData: vscode.EventEmitter<TaskItem | undefined> = new vscode.EventEmitter<
    TaskItem | undefined
  >()
  // and vscode will access the event by using a readonly onDidChangeTreeData (this member has to be named like here, otherwise vscode doesnt update our treeview.
  readonly onDidChangeTreeData?: vscode.Event<TaskItem | undefined> = this.m_onDidChangeTreeData.event

  constructor(taskData: TaskData[]) {
    this.data = taskData.map((td) => new TaskItem(td.label, td, EnumTreeLevel.First))


    vscode.commands.registerCommand(Commands.ClickupRefresh, async () => {
      TaskTreeView.refresh()
    })
    vscode.commands.registerCommand(Commands.ClickupItemClick, async item => {
      this.itemClicked(item)
    })
    vscode.commands.registerCommand(Commands.ClickupContextMenuCommand0, async item => {
      this.command0(item)
    })
    vscode.commands.registerCommand(Commands.ClickupContextMenuCommand1, async item => {
      this.command1(item)
    })
  }

  getTreeItem(element: TaskItem): vscode.TreeItem {
    element.command = {
      command: 'clickup.itemClick',
      title: element.label,
      arguments: [element]
    }
    return element
  }

  getChildren(element?: TaskItem): vscode.ProviderResult<TaskItem[]> {
    if (element === undefined) {
      return this.data
    }

    return element.children
  }

  itemClicked(item: TaskItem) {
    console.log(item)
  }

  command0(item: TaskItem) {
    console.log("context menu command 0 clickd with: ", item.label);
  }
  command1(item: TaskItem) {
    console.log("context menu command 1 clickd with: ", item.label);
  }

  static refresh() {
    console.log('refresh, not yet done')

  }
}

export class TaskItem extends vscode.TreeItem {
  public itemLevel: EnumTreeLevel = EnumTreeLevel.First
  // public tasks: TaskItem[] = []
  public children: TaskItem[] = []

  constructor(
    public readonly label: string,
    item: TaskData | TaskTreeViewData[] | Task[] | Task,
    level: EnumTreeLevel
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed)

    this.itemLevel = level

    // Top level label
    if (level === EnumTreeLevel.First) {
      this.children = (item as TaskData).items.map((i) => new TaskItem(i.label, i.tasks, EnumTreeLevel.Second))
      if ((item as TaskData).label === 'To Do') {
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded
      }
      return
    }

    // Todo label / List label
    if (level === EnumTreeLevel.Second) {
      this.children = (item as Task[]).map((i) => new TaskItem(i.name, i, EnumTreeLevel.Third))
      this.description = `(${this.children.length})`

      if (this.children.length === 0) {
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
      }

      this.iconPath = getIcon("folder.svg")
      this.contextValue = "list"
      return
    }

    // Task List
    const task = item as Task
    let tags = 'No Tags'
    if (task.tags.length) {
      tags = 'Tags: ' + task.tags.reduce((prev, crnt) => !prev ? crnt.name : prev + '|' + crnt.name, '')
    }
    const dueDate = task.due_date === null ? 'No Due Date' : getDate(+task.due_date)
    this.description = task.status.status
    this.tooltip = `${tags} (${dueDate})`
    this.collapsibleState = vscode.TreeItemCollapsibleState.None
    this.contextValue = "task"

    // show assignees icon corresponding to task
    // only me
    const myId = AppState.me?.id
    if (myId && task.assignees.length === 1) {
      if (task.assignees[0].id = myId) {
        this.iconPath = getIcon("me.svg")
      }
      return
    }

    // group
    if (myId && task.assignees.length > 1) {
      let isMine = false
      task.assignees.every((u) => {
        if (u.id === myId) {
          isMine = true
          return false
        }
        return true
      })

      this.iconPath = isMine ? getIcon("group_me.svg") : getIcon("group.svg")
      return
    }

    // no one assigned
    this.iconPath = getIcon("invisible.svg")
  }

  public add_child(child: TaskItem) {
    // this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    // this.children.push(child);
  }
}
