import * as vscode from "vscode";

class TreeViewService implements vscode.TreeDataProvider<vscode.TreeItem> {
  private teams: Array<any>;

  constructor(teams: Array<any>) {
    this.teams = teams;
    console.log(this.teams);
  }

  getTreeItem(element: any): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    let resolve = Object.values(this.teams.teams).map((team: any) => {
      return new vscode.TreeItem(team.name, vscode.TreeItemCollapsibleState.Collapsed);
    });

    console.log(resolve);

    return Promise.resolve(resolve);
  }
}

export { TreeViewService };