const { Clickup } = require("clickup.js");
import { User, Status, Space, Folder, List, Task} from "../util/typings/clickup";
import { LocalStorageService } from "./local_storage_service";

import * as vscode from "vscode";

class ClickUpService {
  private storageService: LocalStorageService;
  private clickUp: typeof Clickup | undefined;
  public userToken: string | undefined;
  public teams : clickup_team | undefined;
  public space : clickup_space | undefined;
  public folder : clickup_folder | undefined;
  public list : clickup_list | undefined;
  public task : clickup_task | undefined;
  constructor(storageService: LocalStorageService) {
    this.storageService = storageService;
  }

  public async setup(): Promise<boolean> {
    this.userToken = await this.getUserToken();

    // Prompt user to input his/her token if the token is undefined
    if (this.userToken === undefined) {
      vscode.window.showErrorMessage("No Click Up Token!", ...["Add Click Up Token"]).then(async (result) => {
        if (result === undefined) { return false; }

        let token: string | undefined = await vscode.window.showInputBox({
          placeHolder: "Please input your user token"
        });

        if (token === undefined || token === "") {
          vscode.window.showErrorMessage("Please input your Click Up token to use Scrummer");

          return false;
        }

        // Update user token and setup API
        this.userToken = token;
        this.storageService.setValue("token", this.userToken);
        this.createClickUp_serivce(this.userToken);
      });
    }
    else { 
      this.createClickUp_serivce(this.userToken);    
    }

    return true;
  }

  // Checking
  public checkAPI() {
    if(this.clickUp === undefined) {
      if(this.userToken === undefined) { this.checkUserToken(); }
      else {
        vscode.window.showErrorMessage("API not set, Please restart Scrummer", ...["Refresh"]).then((result) => {
          if (result === undefined) { return; }
          vscode.commands.executeCommand("workbench.action.reloadWindow");
        });
      }

      return false;
    }

    return true;
  }

  public checkUserToken() {
    console.log(`ClickUpService - checkUserToken: ${this.userToken}`);  // Debug

    if(this.userToken === undefined) {
      return vscode.window.showErrorMessage("Please add your Click Up token to use Scrummer", ...["Add Click Up Token"]).then(async (result) => {
        if(result === undefined) { return; }

        await vscode.window.showInputBox({
          placeHolder: "Please input your user token"
        }).then((userToken) => this.setUserToken(userToken));
      });
    }
  }

  // User token
  public deleteUserToken() {
    this.userToken = undefined;
    this.storageService.setValue("token", this.userToken);
    this.deleteClickUp_serivce();
  }

  public async getUserToken(): Promise<string> {
    if(this.userToken === undefined) { return await this.storageService.getValue("token"); }
    return this.userToken;
  }

  public setUserToken(token: string | undefined) {
    if(token === undefined || token === "") { return vscode.window.showWarningMessage("Please enter a valid user token!"); }

    this.userToken = token;
    this.storageService.setValue("token", this.userToken);
    this.createClickUp_serivce(this.userToken);       
  }
  public createClickUp_serivce (userToken: string) {
    this.clickUp = new Clickup(this.userToken);
    this.teams = new clickup_team(this.clickUp);
    this.space = new clickup_space(this.clickUp);
    this.folder = new clickup_folder(this.clickUp);
    this.list = new clickup_list(this.clickUp);
    this.task = new clickup_task(this.clickUp);      
  }

  public deleteClickUp_serivce () {
    this.clickUp = undefined;
    this.teams = undefined;
    this.space = undefined;
    this.folder = undefined;
    this.list = undefined;
    this.task = undefined;        
  }  
}

class clickup_team {
  private clickUp: typeof Clickup;
  constructor(clickUp : typeof Clickup){
    this.clickUp = clickUp;
  };

  public async getTeams() {
    const {body}  = await this.clickUp.teams.get();
    return body;
  } 
  public async getSpaces(teamId: string) {
    var {body}  = await this.clickUp.teams.getSpaces(teamId);
    var Space: Array<Space> = body.spaces;
    return Space;
  }   
  public async createTeam(name: string) {
    const { body } = await this.clickUp.teams.create(name);
    return body;
  }
  public async createSpace(teamId: string, name: string) {
    const { body } = await this.clickUp.teams.createSpace(teamId, {
        name: name
    });
    return body;
}    
}

class clickup_space {
  private clickUp: typeof Clickup;
  constructor(clickUp : typeof Clickup){
    this.clickUp = clickUp;
  };

  public async getSpace(spaceId: string) {
    const {body}  = await this.clickUp.spaces.get(spaceId);
    const space: Space= body;
    return space;
  } 
  public async getFolders(spaceId: string) {
    var {body}  = await this.clickUp.spaces.getFolders(spaceId);
    var folder: Array<Folder> = body.folders;
    return folder;
  }
  public async getFolderLists(spaceId: string) {
    var { body } = await this.clickUp.spaces.getFolderlessLists(spaceId);
    var lists: Array<List> = body.lists;
    return lists;
  }  
  public async deleteSpace(spaceId: string) {
    const { body } = await this.clickUp.spaces.delete(spaceId);
    return body;
  }
  public async createList(spaceId: string, name: string) {
    const { body } = await this.clickUp.spaces.createFolderlessList(spaceId, {
        name: name
    });
    return body;
  }
  public async getTags(spaceId: string) {
    var { body } = await this.clickUp.spaces.getTags(spaceId);
    //var tags: Array<Tag> = body.tags;
    return body.tags;
  }    
  public async getPriorities(spaceId: string) {
    var body = await this.getSpace(spaceId);
    return body.features.priorities.priorities;
  }  
}

class clickup_folder {
  private clickUp: typeof Clickup;
  constructor(clickUp : typeof Clickup){
    this.clickUp = clickUp;
  };

  public async getLists(folderId: string) {
    var { body } = await this.clickUp.folders.getLists(folderId);
    var lists: Array<List> = body.lists;
    return lists;
  }
}

class clickup_list {
  private clickUp: typeof Clickup;
  constructor(clickUp : typeof Clickup){
    this.clickUp = clickUp;
  };

  public async getTasks(listId: string) {
    var { body } = await this.clickUp.lists.getTasks(listId);
    var tasks: Array<Task> = body.tasks;
    return tasks;
  }

  public async getMembers(listId: string) {
    var { body } = await this.clickUp.lists.getMembers(listId);
    var members: Array<User> = body.members;
    return members;
  }

  public async getStatus(listId: string) {
    var { body } = await this.clickUp.lists.get(listId);
    var status: Array<Status> = body.statuses;
    return status;
  }

  public async newTask(listId: string, data: any) {
    var { body } = await this.clickUp.lists.createTask(listId, data);
    return body;
  }

  public async countTasks(listId: string) {
    var tasks = await this.getTasks(listId);
    return tasks.length === undefined ? 0 : tasks.length;
  } 
}


class clickup_task {
  private clickUp: typeof Clickup;
  constructor(clickUp : typeof Clickup){
    this.clickUp = clickUp;
  };

  public async deleteTask(taskId: string) {
    var { body } = await this.clickUp.tasks.delete(taskId);
    return body;
  }
  public async updateTask(taskId: string, data: any): Promise<any> {
    var { body } = await this.clickUp.tasks.update(taskId, data);
    return body;
  }

  public async updateTaskTags(taskId: string, previousTags: any, tags: any) {
    if (tags === undefined) {
        //remove all tags
        Object.values(previousTags).map((tag: any) => {
            console.log('remove ' + tag.name + 'from task ' + taskId);
            this.clickUp.tasks.removeTag(taskId, tag.name);
        });
        return;
    }

    Object.values(previousTags).map((tag: any) => {
        if (Object.values(tags).includes(tag.name) === false) {
            console.log('remove tag ' + tag.name + 'from task ' + taskId);
            this.clickUp.tasks.removeTag(taskId, tag.name);
        }
    });

    tags.forEach((tagName: string) => {
        var tagFound = previousTags.filter((obj: any) => obj.name === tagName);
        if (tagFound.length === 0) {
            console.log('add tag ' + tagName + 'in task ' + taskId);
            this.clickUp.tasks.addTag(taskId, tagName);
        }
    });
  } 
}
export { ClickUpService };


