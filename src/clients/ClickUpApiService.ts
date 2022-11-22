const { Clickup } = require('clickup.js')
import {
  ApiNewTaskSchema,
  ApiUpdateTaskSchema, EnumTodoLabel, Folder, FolderExtend, List, ListExtend, Space, SpaceLListFile, Status, Tag, Task, Teams, TodoTasksMap, User
} from '../util/typings/clickup'

import { rejects } from 'assert'
import { resolve } from 'path'
import { performance } from 'perf_hooks'

class ClickUpService {
  private clickUp: typeof Clickup | undefined
  public userToken: string | undefined

  public async setup(token: string): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        this.userToken = token
        this.clickUp = new Clickup(this.userToken)
        const me = await this.getMe()
        resolve(me)
      } catch (err) {
        this.clickUp = undefined
        reject(err)
      }
    })
  }


  public deleteClickUp_serivce() {
    this.clickUp = undefined
  }
  // Team Functions
  public async getMe(): Promise<User> {
    const {
      body: { user },
    } = await this.clickUp.authorization.getAuthorizedUser()
    return user as User
  }

  public async getTeams(): Promise<Teams[]> {
    const {
      body: { teams },
    } = await this.clickUp.teams.get()
    return teams
  }
  public async getSpaces(teamId: string) {
    let { body } = await this.clickUp.teams.getSpaces(teamId)
    let Space: Array<Space> = body.spaces
    return Space
  }
  public async createTeam(name: string) {
    const { body } = await this.clickUp.teams.create(name)
    return body
  }
  public async createSpace(teamId: string, name: string) {
    const { body } = await this.clickUp.teams.createSpace(teamId, {
      name: name,
    })
    return body
  }
  // Space functions
  public async getSpace(spaceId: string): Promise<Space> {
    const { body } = await this.clickUp.spaces.get(spaceId)
    //const space: Space= body;
    return body
  }
  public async getFolders(spaceId: string) {
    let { body } = await this.clickUp.spaces.getFolders(spaceId)
    let folder: Array<Folder> = body.folders
    return folder
  }
  public async getFolderLists(spaceId: string) {
    let { body } = await this.clickUp.spaces.getFolderlessLists(spaceId)
    let lists: Array<List> = body.lists
    return lists
  }
  public async deleteSpace(spaceId: string) {
    const { body } = await this.clickUp.spaces.delete(spaceId)
    return body
  }
  public async createList(spaceId: string, name: string) {
    const { body } = await this.clickUp.spaces.createFolderlessList(spaceId, {
      name: name,
    })
    return body
  }
  public async getTags(spaceId: string) {
    let { body } = await this.clickUp.spaces.getTags(spaceId)
    //let tags: Array<Tag> = body.tags;
    return body.tags
  }
  public async getPriorities(spaceId: string) {
    let body = await this.getSpace(spaceId)
    return body.features.priorities.priorities
  }
  // Folder functions
  public async getLists(folderId: string) {
    let { body } = await this.clickUp.folders.getLists(folderId)
    let lists: Array<List> = body.lists
    return lists
  }
  // List functions
  public async getTasks(listId: string): Promise<Task[]> {
    let { body: { tasks } } = await this.clickUp.lists.getTasks(listId)
    // let tasks: Array<Task> = body.tasks
    return tasks as Task[]
  }

  public async getTask(taskId: string): Promise<Task> {
    let { body } = await this.clickUp.tasks.get(taskId)
    return body
  }

  public async getMembers(listId: string) {
    let { body } = await this.clickUp.lists.getMembers(listId)
    let members: Array<User> = body.members
    return members
  }

  public async getStatus(listId: string) {
    let { body } = await this.clickUp.lists.get(listId)
    let status: Array<Status> = body.statuses
    return status
  }

  public async newTask(listId: string, data: ApiNewTaskSchema) {
    let { body } = await this.clickUp.lists.createTask(listId, data)
    return body
  }

  public async countTasks(listId: string) {
    let tasks = await this.getTasks(listId)
    return tasks.length === undefined ? 0 : tasks.length
  }
  // Task Functions
  public async deleteTask(taskId: string) {
    let { body } = await this.clickUp.tasks.delete(taskId)
    return body
  }
  public async updateTask(taskId: string, data: ApiUpdateTaskSchema): Promise<any> {
    let { body } = await this.clickUp.tasks.update(taskId, data)
    return body
  }

  public async updateTaskTags(taskId: string, previousTags: Tag[], tags: string[]): Promise<void> {
    try {
      if (tags === undefined || tags.length === 0) {
        //remove all tags
        Object.values(previousTags).map(async (tag) => {
          // console.log('remove ' + tag.name + ' from task ' + taskId)
          await this.clickUp.tasks.removeTag(taskId, tag.name)
        })
        return
      }

      Object.values(previousTags).map(async (tag: any) => {
        if (Object.values(tags).includes(tag.name) === false) {
          // console.log('remove tag [' + tag.name + '] from task ' + taskId)
          await this.clickUp.tasks.removeTag(taskId, tag.name)
        }
      })

      tags.forEach(async (tagName: string) => {
        let tagFound = previousTags.filter((obj: any) => obj.name === tagName)
        if (tagFound.length === 0) {
          // console.log('add tag [' + tagName + '] in task ' + taskId)
          await this.clickUp.tasks.addTag(taskId, tagName)
        }
      })
      resolve()
    } catch (err) {
      rejects(err)
    }
  }
  // Function: Get all space informations include all list, folder task
  public async getSpaceTree(spaceId: string): Promise<SpaceLListFile> {
    const space = await this.getSpace(spaceId)
    const spaceList = await this.getFolderLists(spaceId)
    const folders = await this.getFolders(spaceId)
    const spaceTree: SpaceLListFile = { ...space, root_lists: [] as ListExtend[], folders: [] as FolderExtend[] }
    // const rootLists: ListExtend[] = <ListExtend[]>spaceList

    const t0 = performance.now();

    const getPromiseRootList = (lists: ListExtend[]): Promise<ListExtend>[] => lists.map((l) => {
      return new Promise(async (resolve, reject) => {
        try {
          const tasks = await this.getTasks(l.id)
          resolve({ ...l, tasks })
        } catch (err) {
          reject(err)
        }
      })
    })

    const promiseFolders: Promise<FolderExtend>[] = (folders).map((f) => {
      return new Promise(async (resolve, reject) => {
        try {
          // TODO: check type
          // @ts-ignore
          const lists = await Promise.all(getPromiseRootList(f.lists))
          resolve({ ...f, lists })
        } catch (err) {
          reject(err)
        }
      })
    })

    spaceTree.root_lists = await Promise.all(
      // @ts-ignore
      getPromiseRootList(spaceList)
    )
    spaceTree.folders = await Promise.all(
      promiseFolders
    )

    // tree.folders = folders
    // tree.root_lists = rootLists

    // // Search Tasks from Root_list
    // for (let i = 0; i < tree.root_lists.length; i++) {
    //   if (tree.root_lists[i].task_count != 0) {
    //     let rootList_tasks = await this.getTasks(tree.root_lists[i].id)
    //     tree.root_lists[i].tasks = rootList_tasks
    //   } else tree.root_lists[i].tasks = []
    // }
    // // Search Tasks from Folders
    // for (let i = 0; i < tree.folders.length; i++) {
    //   for (let j = 0; j < tree.folders[i].lists.length; j++) {
    //     let list: ListExtend = tree.folders[i].lists[j]
    //     list.tasks = []
    //     if (tree.folders[i].lists[j].task_count != 0) {
    //       let List_tasks = await this.getTasks(list.id)
    //       list.tasks = List_tasks
    //       tree.folders[i].lists[j] = list
    //     }
    //   }
    // }

    const t1 = performance.now();
    // console.log(`Fetch space tree took ${t1 - t0} milliseconds.`);

    // return tree
    return spaceTree
  }

  public getTasksFilters(userIds: number[], spaceTree: SpaceLListFile, toDoLabel?: string) {
    let _tasks: Task[] = []
    if (spaceTree == undefined) {
      return null
    }
    // Search Root list Task
    _tasks = this.getAllTasks(spaceTree)

    if (!toDoLabel) {
      return _tasks
    }

    // Check toDoLabel if * , skip
    _tasks = this.TasksFilters(userIds, _tasks, toDoLabel)

    return _tasks
  }

  public getTodoTasks(spaceTree: SpaceLListFile, userIds: number[]): TodoTasksMap {
    const _tasks = this.getAllTasks(spaceTree)
    const date = new Date()
    date.setMilliseconds(0)
    date.setSeconds(0)
    date.setMinutes(0)
    date.setHours(0)
    const time_down = date.getTime()
    const time_up = time_down + 86400000

    const todoTasks: TodoTasksMap = {
      [EnumTodoLabel.today]: [],
      [EnumTodoLabel.overdue]: [],
      [EnumTodoLabel.next]: [],
      [EnumTodoLabel.noDueDate]: [],
    }

    _tasks.forEach((t) => {
      // skip crnt loop if task's assigned isn't exists in userIds
      let matched = false
      t.assignees.every((u) => {
        if (userIds.includes(u.id)) {
          matched = true
          return false
        }
        return true
      })
      if (!matched) {
        return
      }

      // for assigned user
      // no due date
      if (t.due_date === null) {
        todoTasks[EnumTodoLabel.noDueDate].push(t)
        return
      }

      // overdue
      if (+t.due_date < time_up && +t.due_date < time_down) {
        todoTasks[EnumTodoLabel.overdue].push(t)
        return
      }

      // today
      if (+t.due_date < time_up && +t.due_date >= time_down) {
        todoTasks[EnumTodoLabel.today].push(t)
        return
      }
      // next day
      if (+t.due_date >= time_up) {
        todoTasks[EnumTodoLabel.next].push(t)
        return
      }
    })

    return todoTasks
  }

  public getAllTasks(spaceTree: SpaceLListFile) {
    let _tasks: Task[] = []
    // if (spaceTree == undefined) return _tasks
    // else {
    // Search Root list Task
    for (let i = 0; i < spaceTree.root_lists.length; i++) {
      _tasks = _tasks.concat(spaceTree.root_lists[i].tasks)
    }
    for (let i = 0; i < spaceTree.folders.length; i++) {
      for (let j = 0; j < spaceTree.folders[i].lists.length; j++) {
        _tasks = _tasks.concat(spaceTree.folders[i].lists[j].tasks)
      }
    }
    return _tasks

    // const rootListTasks = spaceTree.root_lists.reduce((prev, crnt) => {
    //   const _tasks = crnt.tasks
    //   return [...prev, ..._tasks]
    // }, [] as Task[])

    // const folderListTasks = spaceTree.folders.reduce((prev, crnt) => {
    //   const _lists = crnt.lists
    //   let _tasks: Task[] = []
    //   if (_lists.length > 0) {
    //     _lists.forEach((l) => {
    //       _tasks = [..._tasks, ...l.tasks]
    //     })
    //   }
    //   return [...prev, ..._tasks]
    // }, [] as Task[])

    // return [...rootListTasks, ...folderListTasks]
  }
  public TasksFilters(userIds: number[], tasks: Task[], toDoLabel: string) {
    let _tasks = [...tasks]
    const date = new Date()
    date.setMilliseconds(0)
    date.setSeconds(0)
    date.setMinutes(0)
    date.setHours(0)
    const time_down = date.getTime()
    const time_up = time_down + 86400000

    // Check status if * , skip
    if (toDoLabel !== EnumTodoLabel.allTask)
      _tasks = tasks.filter(({ due_date, status }) => {
        switch (toDoLabel) {
          case EnumTodoLabel.overdue: {
            return due_date !== null && +due_date < time_up && +due_date < time_down
            // return Number(task.due_date) < time_up && task.due_date != null && Number(task.due_date) < time_down //task.due_date define today = today_date+ Time : 04:00
          }
          case EnumTodoLabel.today: {
            return due_date !== null && +due_date < time_up && +due_date >= time_down
            // return Number(task.due_date) < time_up && task.due_date != null && Number(task.due_date) >= time_down
          }
          case EnumTodoLabel.noDueDate: {
            return due_date == null
          }
          case EnumTodoLabel.next: {
            return due_date !== null && +due_date >= time_up
            // return Number(task.due_date) >= time_up && task.due_date != null
          }
          default: {
            return status.status === toDoLabel
          }
        }
      })

    // return all tasks if userIds is empty
    if (userIds.length === 0) {
      return _tasks
    }
    // return only userIds' tasks
    _tasks = _tasks.filter((task) => {
      let matched = false
      task.assignees.every((usr) => {
        if (userIds.includes(usr.id)) {
          matched = true
          return false
        }
        return true
      })
      return matched
    })
    return _tasks
  }
}
export { ClickUpService }
