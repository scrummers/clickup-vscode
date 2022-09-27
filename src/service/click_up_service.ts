const { Clickup } = require("clickup.js");

import { LocalStorageService } from "./local_storage_service";
import * as vscode from "vscode";

class ClickUpService {
  private storageService: LocalStorageService;
  private clickUp: typeof Clickup | undefined;
  public userToken: string | undefined;

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
    else { this.clickUp = new Clickup(this.userToken); }

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
    this.clickUp = undefined;
  }

  public async getUserToken(): Promise<string> {
    if(this.userToken === undefined) { return await this.storageService.getValue("token"); }
    return this.userToken;
  }

  public setUserToken(token: string | undefined) {
    if(token === undefined || token === "") { return vscode.window.showWarningMessage("Please enter a valid user token!"); }

    this.userToken = token;
    this.storageService.setValue("token", this.userToken);
    this.clickUp = new Clickup(this.userToken);
  }

  // ClickUp features
  public createClickUp(target: string) {
    if(!this.checkAPI()) { return; }

    switch(target) {
      default:
        return vscode.window.showWarningMessage(`ClickUpService - Create: Unknown target - "${target}"`);
    }
  }

  public async getClickUp(target: string): Promise<any> {
    if(!this.checkAPI()) { return; }

    switch(target) {
      case "Teams":
        try {
          let { body } = await this.clickUp.teams.get();
          return body;
        }
        catch(error) { console.error(error); }
        break;
      case "Spaces":
        break;
      default:
        return console.log(`ClickUpService - Get: Unknown target - "${target}"`);
    }
  }
}

export { ClickUpService };