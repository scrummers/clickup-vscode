const { Clickup } = require('clickup.js')
import {
  User,
  Status,
  Teams,
  Space,
  Folder,
  List,
  Task,
  SpaceLListFile,
  ListExtend,
  FolderExtend,
  EnumTodoLabel,
} from '../util/typings/clickup'
import { LocalStorageService } from './local_storage_service'

import * as vscode from 'vscode'

class ClickUpService {
  private storageService: LocalStorageService
  private clickUp: typeof Clickup | undefined
  public userToken: string | undefined
  constructor(storageService: LocalStorageService) {
    this.storageService = storageService
  }

  public async setup(token: string) {
    this.userToken = token
    this.clickUp = new Clickup(this.userToken)
  }
  
  // User token
  public deleteUserToken() {
    this.userToken = undefined
    this.storageService.setValue('token', this.userToken)
    this.deleteClickUp_serivce()
  }

  public async getUserToken(): Promise<string> {
    if (this.userToken === undefined) {
      return await this.storageService.getValue('token')
    }
    return this.userToken
  }

  public setUserToken(token: string | undefined) {
    if (token === undefined || token === '') {
      return vscode.window.showWarningMessage('Please enter a valid user token!')
    }

    this.userToken = token
    this.storageService.setValue('token', this.userToken)
    this.clickUp = new Clickup(this.userToken)
  }

  public deleteClickUp_serivce() {
    this.clickUp = undefined
  }
  // Team Functions
  public async getMe(): Promise<any> {
    const {
      body: { user },
    } = await this.clickUp.authorization.getAuthorizedUser()
    return user
  }

  public async getTeams(): Promise<Teams[]> {
    const {
      body: { teams },
    } = await this.clickUp.teams.get()
    return teams
  }
  public async getSpaces(teamId: string) {
    var { body } = await this.clickUp.teams.getSpaces(teamId)
    var Space: Array<Space> = body.spaces
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
  public async getSpace(spaceId: string) {
    const { body } = await this.clickUp.spaces.get(spaceId)
    //const space: Space= body;
    return body
  }
  public async getFolders(spaceId: string) {
    var { body } = await this.clickUp.spaces.getFolders(spaceId)
    var folder: Array<Folder> = body.folders
    return folder
  }
  public async getFolderLists(spaceId: string) {
    var { body } = await this.clickUp.spaces.getFolderlessLists(spaceId)
    var lists: Array<List> = body.lists
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
    var { body } = await this.clickUp.spaces.getTags(spaceId)
    //var tags: Array<Tag> = body.tags;
    return body.tags
  }
  public async getPriorities(spaceId: string) {
    var body = await this.getSpace(spaceId)
    return body.features.priorities.priorities
  }
  // Folder functions
  public async getLists(folderId: string) {
    var { body } = await this.clickUp.folders.getLists(folderId)
    var lists: Array<List> = body.lists
    return lists
  }
  // List functions
  public async getTasks(listId: string) {
    var { body } = await this.clickUp.lists.getTasks(listId)
    var tasks: Array<Task> = body.tasks
    return tasks
  }

  public async getMembers(listId: string) {
    var { body } = await this.clickUp.lists.getMembers(listId)
    var members: Array<User> = body.members
    return members
  }

  public async getStatus(listId: string) {
    var { body } = await this.clickUp.lists.get(listId)
    var status: Array<Status> = body.statuses
    return status
  }

  public async newTask(listId: string, data: any) {
    var { body } = await this.clickUp.lists.createTask(listId, data)
    return body
  }

  public async countTasks(listId: string) {
    var tasks = await this.getTasks(listId)
    return tasks.length === undefined ? 0 : tasks.length
  }
  // Task Functions
  public async deleteTask(taskId: string) {
    var { body } = await this.clickUp.tasks.delete(taskId)
    return body
  }
  public async updateTask(taskId: string, data: any): Promise<any> {
    var { body } = await this.clickUp.tasks.update(taskId, data)
    return body
  }

  public async updateTaskTags(taskId: string, previousTags: any, tags: any) {
    if (tags === undefined) {
      //remove all tags
      Object.values(previousTags).map((tag: any) => {
        console.log('remove ' + tag.name + 'from task ' + taskId)
        this.clickUp.tasks.removeTag(taskId, tag.name)
      })
      return
    }

    Object.values(previousTags).map((tag: any) => {
      if (Object.values(tags).includes(tag.name) === false) {
        console.log('remove tag ' + tag.name + 'from task ' + taskId)
        this.clickUp.tasks.removeTag(taskId, tag.name)
      }
    })

    tags.forEach((tagName: string) => {
      var tagFound = previousTags.filter((obj: any) => obj.name === tagName)
      if (tagFound.length === 0) {
        console.log('add tag ' + tagName + 'in task ' + taskId)
        this.clickUp.tasks.addTag(taskId, tagName)
      }
    })
  }
  // Function: Get all space informations include all list, folder task
  public async getSpaceTree(spaceId: string) {
    var space = await this.getSpace(spaceId)
    var spaceList = await this.getFolderLists(spaceId)
    var folders : FolderExtend[]= <FolderExtend[]>await this.getFolders(spaceId)
    var tree: SpaceLListFile = space
    var rootLists: ListExtend[] = <ListExtend[]>spaceList

    tree.folders = folders
    tree.root_lists = rootLists
    // Search Tasks from Root_list
    for (var i = 0; i < tree.root_lists.length; i++) {
      if (tree.root_lists[i].task_count != 0) {
        var rootList_tasks = await this.getTasks(tree.root_lists[i].id)
        tree.root_lists[i].tasks = rootList_tasks
      } else tree.root_lists[i].tasks = []
    }
    // Search Tasks from Folders
    for (var i = 0; i < tree.folders.length; i++) {
      for (var j = 0; j < tree.folders[i].lists.length; j++) {
        var list: ListExtend = tree.folders[i].lists[j]
        list.tasks = []
        if (tree.folders[i].lists[j].task_count != 0) {
          var List_tasks = await this.getTasks(list.id)
          list.tasks = List_tasks
          tree.folders[i].lists[j] = list
        }
      }
    }
    return tree
  }

  public async getTasksFilters(user_id: number[], space_tree: SpaceLListFile, status: string) {
    var retrunTasks: Task[] = []
    let date = new Date()
    date.setMilliseconds(0)
    date.setSeconds(0)
    date.setMinutes(0)
    date.setHours(0)
    const time_down = date.getTime()
    const time_up = time_down + 86400000
    if (space_tree == undefined) return null
    else {
      // Search Root list Task
      for (var i = 0; i < space_tree.root_lists.length; i++) {
        retrunTasks = retrunTasks.concat(space_tree.root_lists[i].tasks)
      }
      for (var i = 0; i < space_tree.folders.length; i++) {
        for (var j = 0; j < space_tree.folders[i].lists.length; j++) {
          retrunTasks = retrunTasks.concat(space_tree.folders[i].lists[j].tasks)
        }
      }
      // Check status if * , skip
      if (status != EnumTodoLabel.allTask)
        retrunTasks = retrunTasks.filter((Obj) => {
          switch (status) {
            case EnumTodoLabel.overdue: {
              return Number(Obj.due_date) < time_up && Obj.due_date != null && Number(Obj.due_date) < time_down //Obj.due_date define today = today_date+ Time : 04:00
            }
            case EnumTodoLabel.today: {
              return Number(Obj.due_date) < time_up && Obj.due_date != null && Number(Obj.due_date) >= time_down
            }
            case EnumTodoLabel.noDueDate: {
              return Obj.due_date == null
            }
            case EnumTodoLabel.next: {
              return Number(Obj.due_date) >= time_up && Obj.due_date != null
            }
            default: {
              return Obj.status.status === status
            }
          }
        })
      // Serach User_id. If user_id = No Filter
      if (user_id.length != 0) {
        retrunTasks = retrunTasks.filter((Obj) => {
          return Obj.assignees.find((ID) => {
            let check_retrun = false
            for (var i = 0; i < user_id.length; i++) {
              check_retrun = check_retrun || ID.id == user_id[i]
            }
            return check_retrun
          })
        })
      }
    }
    return retrunTasks
  }
}
export { ClickUpService }
