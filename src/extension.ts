import { Commands } from "./commands";
import { ClickUpService } from "./service/click_up_service";
import { LocalStorageService } from "./service/local_storage_service";
import { TreeViewService } from "./service/tree_view_service";
import { WebViewService } from "./service/web_view_service";
import * as path from "path";
import * as vscode from "vscode";

async function activate(context: vscode.ExtensionContext) {
	// Initialization
	let storageService: LocalStorageService = new LocalStorageService(context.workspaceState);
	let clickUpService: ClickUpService = new ClickUpService(storageService);

	await clickUpService.setup().then(async (result) => {
		console.log(`ClickUpService - setup: ${result}`);	// Debug

		if(!result) { return vscode.window.showErrorMessage("Scrummer - Setup failed!"); }

		//let toDoViewService: TreeViewService = new TreeViewService(await clickUpService.teams?.getTeams());

		//await vscode.window.registerTreeDataProvider("Today-Tasks", toDoViewService);
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

		let addTaskWebViewer = new WebViewService(context, ["html", "add_new_task", "add_new_task.html"], "Add New Task", {
			localResources: [vscode.Uri.file(path.join(context.extensionPath, "html", "add_new_task"))],
			receiveMessageFunction: (message) => {
				console.log(message);
			}
		});

		addTaskWebViewer.postMessage({
			command: "Set",
			data: {
				"taskName": "New Task",
				"taskLocation": "New Location"
			}
		})
	});

	vscode.commands.registerCommand(Commands.ClickupDeleteTask, () => {
		vscode.window.showInformationMessage("Deleting Task...");
	});

	vscode.commands.registerCommand(Commands.ClickupEditTask, () => {
		new WebViewService(context, ["html", "edit_task", "edit_task.html"], "Edit Task");
	});

	vscode.commands.registerCommand("Scrummer.hello", () => {
		vscode.window.showInformationMessage("Hello from Scrummer!");

		console.log(vscode.Uri.file(path.join(context.extensionPath, "html", "add_new_task")));
	});

	vscode.commands.registerCommand("Scrummer.testing",  async () => {
		// For testing purposes and examples for each features
		const spaces = await clickUpService.getSpaces("31551016");
		const space = await clickUpService.getSpaceTree("55543351");
		console.log(space);
		const TestSpace = await clickUpService.getSpaceTree("55594352");
		console.log(TestSpace);
		const tasks = await clickUpService.getTasksFilters("0", TestSpace,"to do");
		console.log(tasks);
		//const body = await clickUpService.teams[0].space[0].folder[0].list[0].newTask("Create_from_VScode_program");
	});
}

function deactivate() {}

export {
	activate,
	deactivate
};