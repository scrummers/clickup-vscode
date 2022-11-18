import * as vscode from 'vscode'
import { EnumTodoLabel, EnumTreeLevel, Task, TaskTreeViewData } from '../../util/typings/clickup'
import { getDate, getIcon } from '../../util/helper'
import { Commands } from '../../commands'
import path = require('path')
import { AppState } from '../../store'
import { Client } from '../../clients/Client'

type TaskData = {
  label: string,
  // level: EnumTreeLevel
  // level: 'top'
  items: TaskTreeViewData[]
}

export class TaskTreeView implements vscode.TreeDataProvider<TaskItem> {
  // private taskData: TaskData[]
  private data: TaskItem[]
  private _onDidChangeTreeData: vscode.EventEmitter<TaskItem | undefined> = new vscode.EventEmitter<
    TaskItem | undefined
  >()
  // and vscode will access the event by using a readonly onDidChangeTreeData (this member has to be named like here, otherwise vscode doesnt update our treeview.
  readonly onDidChangeTreeData?: vscode.Event<TaskItem | undefined> = this._onDidChangeTreeData.event

  constructor(taskData: TaskData[]) {
    this.data = this.buildTaskItem(taskData)


    vscode.commands.registerCommand(Commands.ClickupRefresh, async (fullReload = true, item: TaskItem) => {
      this.refresh(fullReload, item)
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

  buildTaskItem(taskData: TaskData[]) {
    return taskData.map((td) => new TaskItem(td.label, td, EnumTreeLevel.First))
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
    // console.log(item)
  }

  command0(item: TaskItem) {
    console.log("context menu command 0 clickd with: ", item.label);
  }
  command1(item: TaskItem) {
    console.log("context menu command 1 clickd with: ", item.label);
  }

  async refresh(fullReload: boolean, item?: TaskItem) {
    if (item && !fullReload) {
      this._onDidChangeTreeData.fire(item);
    } else {
      const client = new Client()
      const taskData = await client.fetchTreeViewData(AppState.crntSpaceId, AppState.me!.id)
      if (!taskData) return
      this.data = this.buildTaskItem(taskData)
      this._onDidChangeTreeData.fire(undefined);
    }
  }
}

export class TaskItem extends vscode.TreeItem {
  public myId!: number
  public assigneeIds?: number[]
  public folderId?: string
  public listId?: string
  public taskId?: string
  public itemLevel: EnumTreeLevel = EnumTreeLevel.First
  public children: TaskItem[] = []

  constructor(
    public label: string,
    item: TaskData | TaskTreeViewData[] | Task[] | Task,
    level: EnumTreeLevel
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed)

    this.itemLevel = level
    this.myId = +AppState.me!.id

    // Top level label
    if (level === EnumTreeLevel.First) {
      this.children = (item as TaskData).items.map((i) => {
        const _treeItem = new TaskItem(i.label, i.tasks, EnumTreeLevel.Second)
        _treeItem.listId = i.listId
        _treeItem.folderId = i.folderId
        return _treeItem
      })
      this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded
      return
    }

    // Todo label / List label
    if (level === EnumTreeLevel.Second) {
      this.children = (item as Task[]).map((i) => new TaskItem(i.name, i, EnumTreeLevel.Third))
      this.description = `(${this.children.length})`

      if (this.children.length === 0) {
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
      }

      if (this.label === EnumTodoLabel.today) {
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded
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
    this.taskId = task.id
    this.listId = task.list.id
    this.collapsibleState = vscode.TreeItemCollapsibleState.None
    this.contextValue = "task"

    // show assignees icon corresponding to task
    // only me
    this.setTaskAssignees(task.assignees.map((a) => a.id))
  }

  public setTaskAssignees(assignesIds: number[]) {
    this.assigneeIds = assignesIds

    const isMeInside = assignesIds.includes(this.myId)

    switch (true) {
      case assignesIds.length == 1:
        this.iconPath = isMeInside ? getIcon("me.svg") : getIcon("assign.svg")
        break
      case assignesIds.length > 1:
        this.iconPath = isMeInside ? getIcon("group_me.svg") : getIcon("group.svg")
        break
      default:
        this.iconPath = getIcon("invisible.svg")
    }
  }

  public addChild(child: TaskItem) {
    // this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    this.children.push(child);
  }
}
