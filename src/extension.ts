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
		// For testing purposes and examples for each features
		/*
		const body =  await clickUpService.teams?.getTeams();
		var space:any =  await clickUpService.teams?.getSpaces("31551016");
		const user:any =  await clickUpService.list?.getMembers("211510805");
		const status =  await clickUpService.list?.getStatus("211510805");
		const folder =  await clickUpService.space?.getFolders("55543351");
		const list =  await clickUpService.folder?.getLists("115759363");
		const task =  await clickUpService.list?.getTasks("211510805");
		const sp_space:any =  await clickUpService.space?.getSpace("55543351");
		console.log(space[0].id);
		console.log(user[0].username);
		console.log(sp_space.id);
		*/
		const name0 = clickUpService.teams[0].getName();
		console.log(name0);
		const space =   clickUpService.teams[0].space[0].getName();
		console.log( space);
		if( (clickUpService.teams[0].space[0].length) == 0)
		{
			console.log("Error");
		}
		console.log( clickUpService.teams[0].space[0].length);
		const folder =  clickUpService.teams[0].space[0].folder[0].getName();
		if( (clickUpService.teams[0].space[0].folder[0].length) == 0)
		{
			console.log("Error");
		}		
		console.log( clickUpService.teams[0].space[0].folder[0].length);
		const list =  clickUpService.teams[0].space[0].list[0].getName();
		if( (clickUpService.teams[0].space[0].folder[0].list[0].length) == 0)
		{
			console.log("Error");
		}			
		console.log( clickUpService.teams[0].space[0].folder[0].list[0].length);
		console.log( folder);		
		console.log(  list);
		const task =  clickUpService.teams[0].space[0].folder[0].list[0].task[0].getName();	
		console.log( task);
		//const body = await clickUpService.teams[0].space[0].folder[0].list[0].newTask("Create_from_VScode_program");
	});
}

function deactivate() {}

export {
	activate,
	deactivate
};