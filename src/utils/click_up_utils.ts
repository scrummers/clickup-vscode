import * as vscode from "vscode";

async function deleteClickUpToken() {
  return await vscode.window.showInformationMessage("Do you really want to delete your token?", ...["Yes", "No"]).then((result) => result);
}

async function getClickUpToken() {
  return await vscode.window.showInputBox({
    placeHolder: "Please input our user token"
  });
}

export { deleteClickUpToken, getClickUpToken };