const { Clickup } = require("clickup.js");
import { User, Status, Teams, Space, Folder, List, Task } from "../util/typings/clickup";
import { LocalStorageService } from "./local_storage_service";

import * as vscode from "vscode";

class ClickUpService {
  private storageService: LocalStorageService;
  private clickUp: typeof Clickup | undefined;
  public userToken: string | undefined;
  public teams: ClickUpTeam[] = [];
  private length: number;

  constructor(storageService: LocalStorageService) {
    this.storageService = storageService;
    this.length = 0;
  }

  public async setup(): Promise<boolean> {
    this.userToken = await this.getUserToken();

    // Prompt user to input his/her token if the token is undefined
    // Suggest user to view walkthrough if token is undefined
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
        await this.createClickUpService();
      });
      vscode.window.showInformationMessage("Would you like view the quick start checklist?", ...["Yes", "No"]).then(async (result) => {
        if (result == "Yes") {
          console.log("ClickUpSercice - open walkthrough");
          vscode.commands.executeCommand(`workbench.action.openWalkthrough`, `scrummer.scrummer#quickStart`);
        }
      });
    }
    else {
      await this.createClickUpService();
    }

    return true;
  }

  // Checking
  public checkAPI() {
    if (this.clickUp === undefined) {
      if (this.userToken === undefined) { this.checkUserToken(); }
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

    if (this.userToken === undefined) {
      return vscode.window.showErrorMessage("Please add your Click Up token to use Scrummer", ...["Add Click Up Token"]).then(async (result) => {
        if (result === undefined) { return; }

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
    this.deleteClickUpService();
  }

  public async getUserToken(): Promise<string> {
    if (this.userToken === undefined) { return await this.storageService.getValue("token"); }
    return this.userToken;
  }

  public setUserToken(token: string | undefined) {
    if (token === undefined || token === "") { return vscode.window.showWarningMessage("Please enter a valid user token!"); }

    this.userToken = token;
    this.storageService.setValue("token", this.userToken);
    this.createClickUpService();
  }

  public async createClickUpService() {
    this.clickUp = new Clickup(this.userToken);
    await this.create_instance();
  }

  public async create_instance() {
    const tmp = await this.getTeams();
    const team_raw: Array<Teams> = tmp.teams;
    this.length = team_raw.length;
    for (var i = 0; i < this.length; i++) {
      this.teams[i] = new ClickUpTeam(this.clickUp, team_raw[i].id, team_raw[i].name);
      await this.teams[i].create_instance();
    }
  }

  public deleteClickUpService() {
    this.clickUp = undefined;
  }

  public async getTeams() {
    const { body } = await this.clickUp.teams.get();
    return body;
  }

  public async createTeam(name: string) {
    const { body } = await this.clickUp.teams.create(name);
    return body;
  }

  public returnSpace(teamid: String, spaceid: String) {
    for (var i = 0; i < this.length; i++) {
      if (this.teams[i].getId() === teamid) {
        for (var j = 0; j < this.teams[i].getLength(); j++) {
          if (this.teams[i].space[j].getId() === spaceid) {
            const space: ClickUpSpace = this.teams[i].space[j];
            return space;
          }
        }
      }
    }
    console.log('team Id' + teamid + 'or' + 'Space Id' + spaceid + 'Not existed');
  }

  public getLength() {
    return this.length;
  }

  public hasToken(): Boolean {
    let userTokenUndefined = this.userToken === undefined;
    console.log("ClickUpService - tokenUndefined: " + userTokenUndefined);
    return userTokenUndefined;
  }

}

class ClickUpBaseClass {
  protected clickUp: typeof Clickup | undefined;
  protected id: string;
  protected name: string;
  protected length: number;
  constructor(clickUp: typeof Clickup, id: string, name: string) {
    this.clickUp = clickUp;
    this.id = id;
    this.name = name;
    this.length = 0;
  }
  public getId() {
    return this.id;
  }
  public getName() {
    return this.name;
  }

  public getLength() {
    return this.length;
  }
}

/*
class clickup_directory{
  protected clickUp: typeof Clickup | undefined;
  public teams : any | undefined;
  constructor(clickUp : typeof Clickup){
    this.clickUp = clickUp;
  }
  public async create_instance() {// May delete later
    const tmp  = await this.getTeams();
    const team_raw: Array<Teams> = tmp.teams;
    for(var i=0; i<team_raw.length; i++){
        this.teams[i] = new clickup_team(this.clickUp, team_raw[i].id,team_raw[i].name);
        await this.teams[i].create_instance();
    }
  }
  public async getTeams() {
    const {body}  = await this.clickUp.teams.get();
    return body;
  }

  public async createTeam(name: string) {
    const { body } = await this.clickUp.teams.create(name);
    return body;
  }  
}
*/
class ClickUpTeam extends ClickUpBaseClass {
  public space: ClickUpSpace[] = [];
  constructor(clickUp: typeof Clickup, id: string, name: string) {
    super(clickUp, id, name);
  }

  public async create_instance() {
    const space_raw = await this.getSpaces();
    this.length = space_raw.length;
    for (var i = 0; i < this.length; i++) {
      this.space[i] = new ClickUpSpace(this.clickUp, space_raw[i].id, space_raw[i].name);
      await this.space[i].create_instance();
    }
  };

  public async getSpaces() {
    var { body } = await this.clickUp.teams.getSpaces(this.id);
    var Space: Array<Space> = body.spaces;
    return Space;
  }

  public async createSpace(name: string) {
    const { body } = await this.clickUp.teams.createSpace(this.id, {
      name: name
    });
    return body;
  }
}

class ClickUpSpace extends ClickUpBaseClass {
  public folder: ClickUpFolder[] = [];
  public list: ClickUpList[] = [];
  private list_length: number;
  constructor(clickUp: typeof Clickup, id: string, name: string) {
    super(clickUp, id, name);
    this.list_length = 0;
    // this.create_instance();
  };

  public async create_instance() {
    const folder_raw = await this.getFolders();
    const list_raw = await this.getFolderLists();
    this.length = folder_raw.length;
    this.list_length = list_raw.length;
    for (var i = 0; i < folder_raw.length; i++) {
      this.folder[i] = new ClickUpFolder(this.clickUp, folder_raw[i].id, folder_raw[i].name);
      await this.folder[i].create_instance();
    }
    for (var i = 0; i < list_raw.length; i++) {
      this.list[i] = new ClickUpList(this.clickUp, list_raw[i].id, list_raw[i].name);
      await this.list[i].create_instance();
    }
  };

  public async getSpace() {
    const { body } = await this.clickUp.spaces.get(this.id);
    const space: Space = body;
    return space;
  }
  public async getFolders() {
    const { body } = await this.clickUp.spaces.getFolders(this.id);
    const folder: Array<Folder> = body.folders;
    return folder;
  }
  public async getFolderLists() {
    const { body } = await this.clickUp.spaces.getFolderlessLists(this.id);
    const lists: Array<List> = body.lists;
    return lists;
  }
  public async deleteSpace() {
    const { body } = await this.clickUp.spaces.delete(this.id);
    return body;
  }
  public async createList(name: string) {
    const { body } = await this.clickUp.spaces.createFolderlessList(this.id, {
      name: name
    });
    return body;
  }
  public async getTags() {
    const { body } = await this.clickUp.spaces.getTags(this.id);
    //var tags: Array<Tag> = body.tags;
    return body.tags;
  }
  public async getPriorities() {
    const body = await this.getSpace();
    return body.features.priorities.priorities;
  }

  public getListLength() {
    return this.list_length;
  }
}

class ClickUpFolder extends ClickUpBaseClass {
  public list: ClickUpList[] = [];

  constructor(clickUp: typeof Clickup, id: string, name: string) {
    super(clickUp, id, name);
    // this.create_instance();
  };

  public async create_instance() {
    const list_raw = await this.getLists();
    this.length = list_raw.length;
    for (var i = 0; i < this.length; i++) {
      this.list[i] = new ClickUpList(this.clickUp, list_raw[i].id, list_raw[i].name);
      await this.list[i].create_instance();
    }
  };

  public async getLists() {
    const { body } = await this.clickUp.folders.getLists(this.id);
    const lists: Array<List> = body.lists;
    return lists;
  }
}

class ClickUpList extends ClickUpBaseClass {
  public task: ClickUpTask[] = [];

  constructor(clickUp: typeof Clickup, id: string, name: string) {
    super(clickUp, id, name);
    //this.create_instance();
  };

  public async create_instance() {// May delete later
    const task_raw = await this.getTasks();
    this.length = task_raw.length;
    for (var i = 0; i < this.length; i++) {
      this.task[i] = new ClickUpTask(this.clickUp, task_raw[i].id, task_raw[i].name);
    }
  };

  public async getTasks() {
    const { body } = await this.clickUp.lists.getTasks(this.id);
    const tasks: Array<Task> = body.tasks;
    return tasks;
  }

  public async getMembers() {
    const { body } = await this.clickUp.lists.getMembers(this.id);
    const members: Array<User> = body.members;
    return members;
  }

  public async getStatus() {
    const { body } = await this.clickUp.lists.get();
    const status: Array<Status> = body.statuses;
    return status;
  }

  public async newTask(data: any) {
    const { body } = await this.clickUp.lists.createTask(this.id, data);
    return body;
  }

  public async countTasks() {
    const tasks = await this.getTasks();
    return tasks.length === undefined ? 0 : tasks.length;
  }
}


class ClickUpTask extends ClickUpBaseClass {

  constructor(clickUp: typeof Clickup, id: string, name: string) {
    super(clickUp, id, name);
  };

  public async deleteTask() {
    const { body } = await this.clickUp.tasks.delete(this.id);
    return body;
  }
  public async updateTask(data: any): Promise<any> {
    const { body } = await this.clickUp.tasks.update(this.id, data);
    return body;
  }

  public async updateTaskTags(previousTags: any, tags: any) {
    if (tags === undefined) {
      //remove all tags
      Object.values(previousTags).map((tag: any) => {
        console.log('remove ' + tag.name + 'from task ' + this.id);
        this.clickUp.tasks.removeTag(this.id, tag.name);
      });
      return;
    }

    Object.values(previousTags).map((tag: any) => {
      if (Object.values(tags).includes(tag.name) === false) {
        console.log('remove tag ' + tag.name + 'from task ' + this.id);
        this.clickUp.tasks.removeTag(this.id, tag.name);
      }
    });

    tags.forEach((tagName: string) => {
      var tagFound = previousTags.filter((obj: any) => obj.name === tagName);
      if (tagFound.length === 0) {
        console.log('add tag ' + tagName + 'in task ' + this.id);
        this.clickUp.tasks.addTag(this.id, tagName);
      }
    });
  }
}
export { ClickUpService };


