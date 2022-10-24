const { Clickup } = require("clickup.js");
import { User, Status, Teams, Space, Folder, List, Task,SpaceLListFile, ListExtend, FolderExtend} from "../util/typings/clickup";
import { LocalStorageService } from "./local_storage_service";

import * as vscode from "vscode";

class ClickUpService {
  private storageService: LocalStorageService;
  private clickUp: typeof Clickup | undefined;
  public userToken: string | undefined;
  public teams : ClickUpTeam[]=[];
  private length : number;

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
        this.clickUp = new Clickup(this.userToken);
      });
    }
    else {
      await this.createClickUpService();
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
    this.createClickUpService();
  }

  public async createClickUpService () {
    this.clickUp = new Clickup(this.userToken);
    await this.create_instance();
  }

  public async create_instance () {
    const tmp  = await this.getTeams();
    const team_raw: Array<Teams> = tmp.teams;
    this.length = team_raw.length;
    for(var i=0; i<this.length; i++){
        this.teams[i] = new ClickUpTeam(this.clickUp, team_raw[i].id,team_raw[i].name);
        await this.teams[i].create_instance();
    }
  }

  public deleteClickUpService () {
    this.clickUp = undefined;
  }

  public async getTeams() {
    const {body}  = await this.clickUp.teams.get();
    return body;
  }

  public async createTeam(name: string) {
    const { body } = await this.clickUp.teams.create(name);
    return body;
  }

  public returnSpace(teamid:String, spaceid: String){
    for(var i=0; i<this.length;i++){
        if(this.teams[i].getId()=== teamid){
          for(var j=0; j<this.teams[i].getLength();j++){
              if(this.teams[i].space[j].getId()===spaceid){
                const space : ClickUpSpace = this.teams[i].space[j];
                return space;
              }
          }
        }
    }
    console.log('team Id' + teamid + 'or' +'Space Id' + spaceid + 'Not existed');
  }

  public getLength(){
    return this.length;
  }

}

class ClickUpBaseClass {
  protected clickUp: typeof Clickup | undefined;
  protected id: string ;
  protected name: string;
  protected length: number;
  constructor(clickUp : typeof Clickup, id:string, name: string){
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
class ClickUpTeam extends ClickUpBaseClass{
  public space: ClickUpSpace[]=[];
  constructor(clickUp : typeof Clickup, id:string, name: string){
    super(clickUp, id, name);
    }

  public async create_instance() {
    const space_raw = await this.getSpaces();
    this.length = space_raw.length;
    for(var i=0; i<this.length; i++){
        this.space[i]= new ClickUpSpace(this.clickUp, space_raw[i].id,space_raw[i].name);
        await this.space[i].create_instance();
    }
  };

  public async getSpaces() {
    var {body}  = await this.clickUp.teams.getSpaces(this.id);
    var Space: Array<Space> = body.spaces;
    return Space;
  }

  public async createSpace(name: string) {
    const { body } = await this.clickUp.teams.createSpace(this.id, {
        name: name
    });
    return body;
  }
  // Space functions
  public async getSpace(spaceId: string) {
    const {body}  = await this.clickUp.spaces.get(spaceId);
    //const space: Space= body;
    return body;
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

  public  getListLength() {
    return this.list_length;
  }
}

class ClickUpFolder extends ClickUpBaseClass{
  public list: ClickUpList[]=[];

  constructor(clickUp : typeof Clickup, id:string, name: string){
    super(clickUp, id, name);
   // this.create_instance();
  };

  public async create_instance() {
    const list_raw = await this.getLists();
    this.length = list_raw.length;
    for(var i=0; i<this.length; i++){
      this.list[i] = new ClickUpList(this.clickUp, list_raw[i].id, list_raw[i].name);
      await this.list[i].create_instance();
    }
  };

  public async getLists() {
    const { body } = await this.clickUp.folders.getLists(this.id);
    const lists: Array<List> = body.lists;
    return lists;
  }
  // List functions
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
  // Task Functions
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
  // Function: Get all space informations include all list, folder task
  public async getSpaceTree(spaceId: string){
    var space  = await this.getSpace(spaceId);
    var spaceList = await this.getFolderLists(spaceId);
    var folders = await this.getFolders(spaceId);
    var tree:SpaceLListFile = space;
    var rootLists : ListExtend[] = <ListExtend[]>spaceList;
    tree.folders = folders;
    tree.root_lists = rootLists;
    // Search Tasks from Root_list
    for(var i=0;i<tree.root_lists.length;i++){
      if(tree.root_lists[i].task_count !=0){
        var rootList_tasks = await this.getTasks(tree.root_lists[i].id);
        tree.root_lists[i].tasks =  rootList_tasks;
      }
    }
    // Search Tasks from Folders
    for(var i=0; i<tree.folders.length; i++){
      for(var j=0; j<tree.folders[i].lists.length;j++){
        var list: ListExtend = tree.folders[i].lists[j];
        if(tree.folders[i].lists[j].task_count !=0){
          var List_tasks = await this.getTasks(list.id);
          list.tasks = List_tasks;
          tree.folders[i].lists[j] =  list;
        }
      }
    }
    return tree;
  }

  public async getTasksFilters(user_id:string, space_tree:SpaceLListFile, status:string){
    var retrunTasks: Task[]=[];
    if(space_tree==undefined)
      return null;
    else{
      // Search Root list Task
      for(var i=0; i < space_tree.root_lists.length;i++){
        for(var j=0; j < space_tree.root_lists[i].task_count; j++)
            retrunTasks.push(space_tree.root_lists[i].tasks[j]);
      }
      for(var i=0; i < space_tree.folders.length; i++){
        for(var j=0; j < space_tree.folders[i].lists.length;j++){
          for(var z=0; z <space_tree.folders[i].lists[j].task_count;z++){
            retrunTasks.push(space_tree.folders[i].lists[j].tasks[z]);
          }
        }
      }
     // var x = retrunTasks.find((Obj) =>{
     //   return (Obj.status.status===status && Obj.assignees.find((name)=>{
     //   return name ===
      //  }));
     // });

    }
    return retrunTasks;
  }

}
export { ClickUpService };


