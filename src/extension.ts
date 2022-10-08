import { Commands } from "./commands";
import { ClickUpService } from "./service/click_up_service";
import { LocalStorageService } from "./service/local_storage_service";
import { TreeViewService } from "./service/tree_view_service";
import { WebViewService } from "./service/web_view_service";
import * as vscode from "vscode";

async function activate(context: vscode.ExtensionContext) {
	console.log("\"Scrummer\" is now active!");

	// Initialization
	let storageService: LocalStorageService = new LocalStorageService(context.workspaceState);
	let clickUpService: ClickUpService = new ClickUpService(storageService);

	await clickUpService.setup().then(async (result) => {
		console.log(`ClickUpService - setup: ${result}`);	// Debug

		if(!result) { return vscode.window.showErrorMessage("Scrummer - Setup failed!"); }

		let toDoViewService: TreeViewService = new TreeViewService(await clickUpService.teams?.getTeams());

		await vscode.window.registerTreeDataProvider("Today-Tasks", toDoViewService);
	});

	// Command function
	vscode.commands.registerCommand(Commands.ClickupSetToken, async () => {
		await vscode.window.showInputBox({
			placeHolder: "Please input your user token"
		}).then((userToken) => clickUpService.setUserToken(userToken));
	});

	vscode.commands.registerCommand("Scrummer.deleteClickUpToken", async () => {
		await vscode.window.showInformationMessage("Do you really want to delete your token?", ...["Yes", "No"]).then((result) => {
			if(result === undefined || result === "No") { return; }

			clickUpService.deleteUserToken();
		});
	});

	vscode.commands.registerCommand("Scrummer.editClickUpToken", async () => {
		await vscode.window.showInputBox({
			placeHolder: "Please input a new user token"
		}).then((userToken) => clickUpService.setUserToken(userToken));
	});

	vscode.commands.registerCommand(Commands.ClickupAddTask, async () => {
		if (clickUpService.userToken === undefined) { return vscode.window.showErrorMessage("Please input your Click Up token to use Scrummer"); }

		new WebViewService(context, ["html", "add_new_task", "add_new_task.html"], "Add New Task", {
			receiveMessageFunction: (message) => {
				console.log(message);
			}
		});
	});

	vscode.commands.registerCommand(Commands.ClickupDeleteTask, () => {
		vscode.window.showInformationMessage("Deleting Task...");
	});

	vscode.commands.registerCommand(Commands.ClickupEditTask, () => {
		new WebViewService(context, ["html", "edit_task", "edit_task.html"], "Edit Task");
	});

	vscode.commands.registerCommand("Scrummer.hello", () => {
		vscode.window.showInformationMessage("Hello from Scrummer!");

		console.log(storageService);
		console.log(clickUpService);
		// console.log(treeViewService);
	});

	vscode.commands.registerCommand("Scrummer.testing",  async () => {
		const body =  await clickUpService.teams?.getTeams();
		console.log(body);
	});
}

function deactivate() {}

export {
	activate,
	deactivate
};