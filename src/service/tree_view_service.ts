import { ClickUpTeam } from "../type";
import * as vscode from "vscode";

class TreeViewService implements vscode.TreeDataProvider<vscode.TreeItem> {
  private teams: ClickUpTeam;

  constructor(teams: ClickUpTeam) {
    this.teams = teams;

    console.log(this.teams);
  }

  getTreeItem(element: any): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    let resolve: any[] | undefined;

    if(this.teams !== undefined) {
      resolve = Object.values(this.teams.teams).map((team: any) => {
        return new vscode.TreeItem(team.name, vscode.TreeItemCollapsibleState.Collapsed);
      });
    }

    return Promise.resolve(resolve);
  }
}

export { TreeViewService };