import { commands, ExtensionContext, Position, Range, window } from 'vscode'
import { Client } from './clients/Client'
import { TaskItem } from './service/TreeView/TaskTreeView'
import { ViewLoader } from './service/WebView/ViewLoader'
import { AppState } from './store'
import { getUtcTodayEnd, getUtcTodayStart } from './util/helper'
import { EnumTodoLabel, EnumTreeLevel, Task } from './util/typings/clickup'
import { CodelensCreateTask, EnumButtonAction, EnumInitWebRoute } from './util/typings/system'

export enum Commands {
  // Treeview
  ClickupRefresh = 'clickup.refresh',
  ClickupItemClick = 'clickup.itemClick',

  ClickupGetMyData = 'clickup.getMyData',
  // Config
  ClickupSetToken = 'clickup.setToken',
  ClickupUpdateToken = 'clickup.updateToken',
  ClickupDeleteToken = 'clickup.deleteToken',
  ClickupAccount = 'clickup.account',

  // Task
  ClickupQuickAddTask = 'clickup.quickAddTask',
  ClickupUpdateStatus = 'clickup.updateStatus',
  ClickupAssignTask = 'clickup.assignTask',
  ClickupAddTask = 'clickup.addTask',
  ClickupViewTask = 'clickup.viewTask',
  ClickupDeleteTask = 'clickup.deleteTask',
  ClickupUpdateTags = 'clickup.updateTags',

  // Workspace
  ClickupSelectWorkspace = 'clickup.selectWorkspace',

  // System
  // GetAppState = 'clickup.getAppState',
}

export function registerCommands(vscodeContext: ExtensionContext, client: Client) {
  vscodeContext.subscriptions.push(
    commands.registerCommand(Commands.ClickupAccount, async () => {
      const options = [
        {
          label: 'Switch ClickUp Account',
          description: 'Use another ClickUp API token',
          id: 'switch'
        },
        {
          label: 'Logout',
          description: 'Remove current ClickUp API token',
          id: 'logout'
        },
      ]

      const selected = await window.showQuickPick(options, {
        title: `Account`,
      })

      if (!selected) return

      if (selected.id === 'switch') {
        commands.executeCommand(Commands.ClickupUpdateToken)
      } else {
        commands.executeCommand(Commands.ClickupDeleteToken)
      }

    }),

    /** Web View */
    commands.registerCommand(Commands.ClickupViewTask, async (item: TaskItem | { taskId: string }) => {
      try {
        if (!item || !item.taskId) return

        ViewLoader.currentPanel?.dispose()

        const task = await client.getTaskById(item.taskId)

        if (!task) {
          throw new Error('Task not found')
        }

        const data = {
          // task: await client.stateGetTaskData(listId, taskId),
          task,
          teams: client.getAppState.spaceMembers,
          lists: client.getAppState.spaceList,
          // teams: await client.stateGetListMembers(listId),
          statuses: await client.stateGetListStatus(task!.list.id),
          // lists: await client.stateGetSpaceList(),
          // priorities: await client.stateGetProrities()
          tags: await client.stateGetSpaceTags(AppState.crntSpaceId),
          priorities: client.getAppState.spacePriorities,
        }
        // console.log({ data })

        ViewLoader.showWebview(vscodeContext, EnumInitWebRoute.ViewTask, data);
      } catch (err) {
        window.showErrorMessage(err.message)
      }
    }),

    commands.registerCommand(Commands.ClickupAddTask, async () => {
      try {

        ViewLoader.currentPanel?.dispose()

        const data = {
          teams: client.getAppState.spaceMembers,
          statuses: [],
          // status: await client.stateGetListStatus(listId),
          lists: client.getAppState.spaceList,
          tags: await client.stateGetSpaceTags(AppState.crntSpaceId),
          priorities: client.getAppState.spacePriorities
        }
        // console.log({ data })

        ViewLoader.showWebview(vscodeContext, EnumInitWebRoute.AddTask, data);
      } catch (err) {
        window.showErrorMessage(err.message)
      }
    }),


    /** TASK */
    commands.registerCommand(Commands.ClickupUpdateTags, async (item: TaskItem) => {
      try {
        const { taskId, listId } = item
        if (!listId || !taskId || !item) return

        const tags = await client.stateGetSpaceTags(AppState.crntSpaceId)
        if (tags.length === 0) {
          await window.showInformationMessage('No tags in current space. You may create the tags from ClickUp Official App')
          return
          // const actionString = await window.showInformationMessage('No tags in current space, do you want to create a tag now?', ...['Create', 'Cancel'])
          // if (actionString === 'Create') {
          //   // TODO: create tag
          //   console.log('exe create tag command')
          // }
          // return
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

        // console.log({ selectedTags })

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
    commands.registerCommand(Commands.ClickupQuickAddTask, async (item?: TaskItem | CodelensCreateTask) => {
      try {
        let listId = ''
        let isSecondLevel = false
        let isToday = false
        let isTodoCategory = false
        let taskInput = ''
        let codeLensProp: CodelensCreateTask | null = null

        if (item && 'listId' in item) {
          listId = item && item.listId ? '' : ''
        }
        if (item && 'itemLevel' in item) {
          isSecondLevel = item && item.itemLevel === EnumTreeLevel.Second
        }
        if (item && 'label' in item) {
          // i.e. if label is 'today', 'overdue',, then is classify to my task by default
          isToday = isSecondLevel && item.label === EnumTodoLabel.today
          isTodoCategory = isSecondLevel && (Object.values(EnumTodoLabel) as string[]).includes(item.label)
        }

        if (item && 'taskname' in item && 'matchedLine' in item && 'line' in item && 'position' in item) {
          codeLensProp = { ...item }
          taskInput = item.taskname
        }

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


        if (!taskInput) {
          const input = await window.showInputBox({
            placeHolder: 'Task name',
            title: `Please enter a task name`,
            ignoreFocusOut: true,
          })

          if (!input) {
            window.showInformationMessage("Cancelled")
            return
          }

          taskInput = input
        }

        const data: any = {
          name: taskInput,
          description: '',
          status: 'to do',

          ...(isToday && {
            start_date: getUtcTodayStart(),
            start_date_time: true,
            due_date: getUtcTodayEnd(),
            due_date_time: true
          }),

          ...(isTodoCategory && {
            assignees: [AppState.me!.id]
          })
        }

        const task = await client.createNewTask(listId, data)

        if (codeLensProp !== null && window.activeTextEditor) {
          window.activeTextEditor.edit(editbuilder => {
            const newCode = codeLensProp!.line.text + ` #${task.id}`

            editbuilder.replace(new Range(new Position(codeLensProp!.matchedLine, 0), codeLensProp!.line.range.end), newCode)
          })
        }

        commands.executeCommand(Commands.ClickupRefresh)

        const message = `
          Task Create Success!
        `

        const action = await window.showInformationMessage(message, ...[EnumButtonAction.OpenTask, EnumButtonAction.Ok])
        if (action == EnumButtonAction.OpenTask) {
          commands.executeCommand(Commands.ClickupViewTask, { taskId: task.id })
        }
      } catch (err) {
        window.showErrorMessage(err.message)
      }

    }),
    commands.registerCommand(Commands.ClickupSetToken, async () => {
      try {
        const input = await window
          .showInputBox({
            title: 'Please enter your ClickUp API token to access the ClickUp service',
            placeHolder: 'Token',
          })

        if (!input) {
          return
        }

        await client.setToken(input)
        window.showInformationMessage('Login Success')

      } catch (err) {
        window.showErrorMessage('Invalid API token')
        // const actions = await window.showInformationMessage('Read our user guide', ...['Now', 'No thanks'])
        // if (actions === 'Now') {
        //   commands.executeCommand("workbench.action.openWalkthrough", "scrummers.clickitup#quickStart")
        // }
      }
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

      const input = await window
        .showInputBox({
          placeHolder: 'Please enter your ClickUp API token',
        })
      if (!input) return

      if (input) {
        try {
          // remove all data
          client.deleteToken()

          await client.setToken(input)
          window.showInformationMessage('ClickUp API token update succeed')
        } catch (err) {
          window.showErrorMessage('Unable to set the API token')
        }
      }
    }),

    // commands.registerCommand(Commands.GetAppState, async () => {
    // console.log(JSON.stringify(AppState, null, 4))
    // }),
    // commands.registerCommand(Commands.ClickupGetStorageData, async () => {
    //   const storage = new LocalStorageService(vscodeContext.workspaceState)
    //   const token = await storage.getValue('token')
    // }),
    // commands.registerCommand(Commands.ClickupGetMyData, async () => {
    //   const me = await client.service.getMe()

    // }),
    commands.registerCommand(Commands.ClickupSelectWorkspace, async () => {
      try {
        const workspaces = await client.service.getTeams()
        const options = workspaces.map((ws) => ({
          label: ws.name,
          id: ws.id,
          description: `#${ws.id}, Teams: ${ws.members.length} `,
        }))

        const slctWorkspace = await window.showQuickPick(options, {
          matchOnDetail: true,
          title: 'Select Workspace',
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
          title: 'Select the Space to focus on',
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
