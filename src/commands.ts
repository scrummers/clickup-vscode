import { commands, ExtensionContext, TreeItemCollapsibleState, window } from 'vscode'
import { Client } from './clients/Client'
import { LocalStorageService } from './service/local_storage_service'
import { TaskItem } from './service/TreeView/TaskTreeView'
import { WebViewService } from './service/web_view_service'
import { AppState } from './store'
import { INIT } from './util/const'
import { getUtcTodayEnd, getUtcTodayStart } from './util/helper'
import { ApiNewTaskSchema, EnumTodoLabel, EnumTreeLevel, Task } from './util/typings/clickup'
import { ViewLoader } from './view/ViewLoader'

export enum Commands {
  // temp
  ClickupGetStorageData = 'clickup.getStorageData',

  // Treeview
  ClickupRefresh = 'clickup.refresh',
  ClickupItemClick = 'clickup.itemClick',
  ClickupContextMenuCommand0 = 'clickup.contextMenuCommand0',
  ClickupContextMenuCommand1 = 'clickup.contextMenuCommand1',


  ClickupGetMyData = 'clickup.getMyData',
  // Config
  ClickupSetToken = 'clickup.setToken',
  ClickupUpdateToken = 'clickup.updateToken',
  ClickupDeleteToken = 'clickup.deleteToken',

  // Task
  ClickupQuickAddTask = 'clickup.quickAddTask',
  ClickupAddTaskFromList = 'clickup.addTaskFromList',
  ClickupUpdateStatus = 'clickup.updateStatus',
  ClickupAssignTask = 'clickup.assignTask',
  ClickupAddTask = 'clickup.addTask',
  ClickupEditTask = 'clickup.editTask',
  ClickupViewTask = 'clickup.viewTask',
  ClickupDeleteTask = 'clickup.deleteTask',
  ClickupUpdateTags = 'clickup.updateTags',

  // Workspace
  ClickupSelectWorkspace = 'clickup.selectWorkspace',

  // System
  GetAppState = 'clickup.getAppState',
}

export function registerCommands(vscodeContext: ExtensionContext, client: Client) {
  vscodeContext.subscriptions.push(
    /** TASK */
    commands.registerCommand(Commands.ClickupUpdateTags, async (item: TaskItem) => {
      try {
        const { taskId, listId } = item
        if (!listId || !taskId || !item) return

        const tags = await client.stateGetSpaceTags(AppState.crntSpaceId)
        if (tags.length === 0) {
          const actionString = await window.showInformationMessage('No tags in current space, do you want to create a tag now?', ...['Create', 'Cancel'])
          if (actionString === 'Create') {
            // TODO: create tag
            console.log('exe create tag command')
          }
          return
        }

        const options = tags.map((t) => ({
          label: t.name,
          description: item.tags?.includes(t.name) ? '(Current)' : '',
          id: t.name,
        }))

        const selected = await window.showQuickPick(options, {
          matchOnDetail: true,
          canPickMany: true,
          matchOnDescription: true,
          title: `Select tags for the task (${item.label})`,
          placeHolder: 'Check the tags to set or check again to unset',
        })

        if (!selected) return

        // const selectedTags = selected.map((s) => !item.tags?.includes(s.id) ? s.id)
        const selectedTags: string[] = selected.reduce((prev, crnt) => {
          if (item.tags?.includes(crnt.id)) {
            return [...prev]
          }
          return [...prev, crnt.id]
        }, [] as string[])

        console.log({ selectedTags })

        await client.updateTaskTags(listId, taskId, selectedTags)

        commands.executeCommand(Commands.ClickupRefresh)
        window.showInformationMessage('Tag update success')

      } catch (err) {
        window.showErrorMessage(err.message)
      }
    }),

    commands.registerCommand(Commands.ClickupAssignTask, async (item: TaskItem) => {
      try {
        const { taskId, listId } = item
        if (!listId || !taskId || !item) return

        const members = await client.stateGetListMembers(listId)
        if (!members) return
        const options = members.map((m) => ({
          label: m.username,
          description: item.assigneeIds?.includes(m.id) ? '(Assigned)' : '',
          id: m.id,
        }))

        const selected = await window.showQuickPick(options, {
          matchOnDetail: true,
          canPickMany: true,
          matchOnDescription: true,
          title: 'Select member for the task',
          placeHolder: 'Check the member to assigned or unassigned',
        })

        if (!selected) return
        const memberIds = selected.map((s) => s.id)
        const resp = await client.updateTaskField(listId, taskId, "assignees", memberIds)
        const newAssigneeIds = (resp as Task).assignees.map((a) => a.id)

        item.setTaskAssignees(newAssigneeIds)
        commands.executeCommand(Commands.ClickupRefresh, false, item)

      } catch (err) {
        window.showErrorMessage(err.message || 'something wrong')
      }
    }),
    commands.registerCommand(Commands.ClickupUpdateStatus, async (item: TaskItem) => {
      try {
        const { taskId, listId } = item
        const status = await client.stateGetListStatus(listId!)
        if (!status) return
        const options = status.map((s) => ({
          label: s.status,
          id: s.id,
        }))

        const selected = await window.showQuickPick(options, {
          matchOnDetail: true,
        })
        if (!selected) return

        await client.updateTaskField(listId!, taskId!, 'status', selected.label)

        // trigger tree item refersh
        item.description = selected.label
        commands.executeCommand(Commands.ClickupRefresh, false, item)

        window.showInformationMessage('Update task sucess')
      } catch (err) {
        window.showErrorMessage(err.message || 'something wrong')
      }

    }),
    commands.registerCommand(Commands.ClickupQuickAddTask, async (item?: TaskItem) => {
      try {
        let listId = item && item.listId
        const isSecondLevel = item && item.itemLevel === EnumTreeLevel.Second
        const isToday = isSecondLevel && item.label === EnumTodoLabel.today
        // i.e. if label is 'today', 'overdue',, then is classify to my task by default
        const isTodoCategory = isSecondLevel && (Object.values(EnumTodoLabel) as string[]).includes(item.label)

        if (!listId) {
          const spaceList = AppState.spaceList
          if (!spaceList || spaceList.length === 0) {
            throw new Error('Please create a list first')
          }
          const options = spaceList.map((l) => ({
            label: l.label,
            id: l.id,
            // detail: l.id,
          }))
          const selectedList = await window.showQuickPick(options, {
            matchOnDetail: true,
          })

          if (!selectedList) {
            return
          }

          listId = selectedList.id
        }

        if (!listId) return

        const taskInput = await window.showInputBox({
          placeHolder: 'Task name @[date] #[tags] %[assignee]',
          title: `Please enter a task name`,
          ignoreFocusOut: true,
        })

        if (!taskInput) {
          window.showInformationMessage("Cancelled")
          return
        }

        const data: ApiNewTaskSchema = {
          ...INIT.newTask,
          name: taskInput,
          description: 'new task ddesc',
          priority: 2,
          status: 'to do',
          start_date: Date.now(),
          due_date: Date.now() + 1000000,
          time_estimate: 8640000,

          ...(isToday && {
            start_date: getUtcTodayStart(),
            due_date: getUtcTodayEnd()
          }),

          ...(isTodoCategory && {
            assignees: [AppState.me!.id]
          })
        }

        const task = await client.createNewTask(listId, data)
        console.log('new task', task, data)

        // if (item) {
        //   item.addChild(new TaskItem(task.name, task, EnumTreeLevel.Third))
        //   commands.executeCommand(Commands.ClickupRefresh, false, item)
        // } else {
        //   commands.executeCommand(Commands.ClickupRefresh)
        // }

        commands.executeCommand(Commands.ClickupRefresh)

        const message = `
          ### Task Create Success!
        `

        // TODO: reload tree view
        const action = await window.showInformationMessage(message, ...['Open Task', 'OK'])
        console.log({ action })
      } catch (err) {
        window.showErrorMessage(err.message)
      }

    }),
    commands.registerCommand(Commands.ClickupSetToken, async () => {
      await window
        .showInputBox({
          placeHolder: 'Please enter your ClickUp API token',
        })
        .then(async (token) => {
          if (token) {
            try {
              await client.setToken(token)
              window.showInformationMessage('API token register succeed')
            } catch (err) {
              window.showErrorMessage('API token error')
            }
          }
        })
    }),
    commands.registerCommand(Commands.ClickupDeleteToken, async () => {
      if (!client.isTokenExist()) {
        window.showErrorMessage('Token has not been set')
        return
      }

      await window
        .showInformationMessage('Do you really want to delete your token?', ...['Yes', 'No'])
        .then(async (result) => {
          if (result === undefined || result === 'No') {
            return
          }
          client.deleteToken()
          window.showInformationMessage('Clickup API token is deleted')
        })
    }),
    commands.registerCommand(Commands.ClickupUpdateToken, async () => {
      if (!client.isTokenExist()) {
        window.showErrorMessage('Token has not been set')
        return
      }

      await window
        .showInputBox({
          placeHolder: 'Please enter your ClickUp API token',
        })
        .then(async (token) => {
          if (token) {
            try {
              // remove old data
              client.deleteToken()

              //TODO: should verify whether the new token is valid, otherwise reverse it

              await client.setToken(token)
              window.showInformationMessage('API token update succeed')
            } catch (err) {
              window.showErrorMessage('API token error')
            }
          }
        })
    }),

    commands.registerCommand(Commands.GetAppState, async () => {
      console.log(JSON.stringify(AppState, null, 4))
    }),
    commands.registerCommand(Commands.ClickupGetStorageData, async () => {
      const storage = new LocalStorageService(vscodeContext.workspaceState)
      const token = await storage.getValue('token')
    }),
    // commands.registerCommand(Commands.ClickupGetMyData, async () => {
    //   const me = await client.service.getMe()

    // }),
    commands.registerCommand(Commands.ClickupSelectWorkspace, async () => {
      try {
        const workspaces = await client.service.getTeams()
        console.log({ workspaces })
        const options = workspaces.map((ws) => ({
          label: ws.name,
          id: ws.id,
          description: `#${ws.id}, Teams: ${ws.members.length} `,
        }))

        const slctWorkspace = await window.showQuickPick(options, {
          matchOnDetail: true,
          title: 'Select Workspace',
          // onDidSelectItem: (item) => console.log('selected', item),
        })

        if (!slctWorkspace) return

        // get spaces by team's id
        const spaces = await client.service.getSpaces(slctWorkspace.id)
        const spacesOptions = spaces.map((sp) => ({
          label: sp.name,
          id: sp.id,
          description: sp.private ? 'Private' : 'Public',
        }))
        const slctSpace = await window.showQuickPick(spacesOptions, {
          matchOnDetail: true,
        })

        if (!slctSpace) return

        const selectedTeam = workspaces.find((w) => w.id == slctWorkspace.id)
        client.stateUpdateTeams(selectedTeam!)

        if (!client.tree) {
          client.setupTreeView(slctSpace.id)
        } else {
          AppState.crntSpaceId = slctSpace.id
          commands.executeCommand(Commands.ClickupRefresh)
        }
      } catch (err) {
        window.showErrorMessage(err.message || 'something wrong')
      }
    })
  )
}
