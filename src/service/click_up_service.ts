import { LocalStorageService } from "./local_storage_service";
import * as vscode from "vscode";

class ClickUpService {
  private storageService: LocalStorageService;
  public userToken: string | undefined;

  constructor(storageService: LocalStorageService) {
    this.storageService = storageService;
    this.getUserToken().then((value) => {
      this.userToken = value;

      // Prompt user to input his/her token if the token is undefined
      if (this.userToken === undefined) {
        vscode.window.showErrorMessage("No Click Up Token!", ...["Add Click Up Token"]).then(async (result) => {
          if (result === undefined) { return; }

          let token: string | undefined = await vscode.window.showInputBox({
            placeHolder: "Please input your user token"
          });

          if(token === undefined || token === "") { return vscode.window.showErrorMessage("Please input your Click Up token to use Scrummer"); }

          // Update user token
          this.userToken = token;
          this.storageService.setValue("token", this.userToken);
        });
      }
    }).catch((e) => console.log(e));
  }

  public deleteUserToken() {
    this.userToken = undefined;
    this.storageService.setValue("token", this.userToken);
  }

  public async getUserToken(): Promise<string> {
    if(this.userToken === undefined) { return await this.storageService.getValue("token"); }
    return this.userToken;
  }

  public setUserToken(token: string) {
    if(token === undefined) { return vscode.window.showWarningMessage("Please enter a valid user token!"); }

    this.userToken = token;
    this.storageService.setValue("token", this.userToken);
  }
}

export { ClickUpService };