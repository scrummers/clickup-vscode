import { getAddNewTaskView, getEditTaskView } from "./html/add_new_task";
import { LocalStorageService } from "./service/local_storage_service";
import * as vscode from "vscode";

async function activate(context: vscode.ExtensionContext) {
	console.log("\"Scrummer\" is now active!");

	// Initialization
	// -> Set local storage service
	let storageService: LocalStorageService = new LocalStorageService(context.workspaceState);
	// -> Get data from local storage
	let token: string = await storageService.getValue("token");

	// Check have token or not on activate
	if(token === undefined)	{
		vscode.window.showErrorMessage("No ClickUp Token!", ...["Add Click Up Token"]).then(async (result) => {
			if(result === undefined) { return; }

			let userToken: string | undefined = await vscode.window.showInputBox({
				placeHolder: "Please input your user token"
			});

			if(userToken === "") { return vscode.window.showErrorMessage("Please input your Click Up Token to use Scrummer"); }

			storageService.setValue("token", userToken);
		});
	}

	// Command function
	vscode.commands.registerCommand("Scrummer.addClickUpToken", async () => {
		let userToken: string | undefined = await vscode.window.showInputBox({
			placeHolder: "Please input our user token"
		});

		if(userToken === undefined || userToken === "") { return vscode.window.showErrorMessage("Please input your Click Up token to use Scrummer"); }

		storageService.setValue("token", userToken);
	});

	vscode.commands.registerCommand("Scrummer.deleteClickUpToken", async () => {
		let result: string | undefined = await vscode.window.showInformationMessage("Do you really want to delete your token?", ...["Yes", "No"]).then((result) => result);

		if(result === undefined || result === "No") { return; }

		storageService.deleteValue("token");
	});

	vscode.commands.registerCommand("Scrummer.editClickUpToken", async () => {
		let userToken: string | undefined = await vscode.window.showInputBox({
			placeHolder: "Please input a new user token"
		});

		if(userToken === undefined || userToken === "") { return; }

		storageService.setValue("token", userToken);
	});

	vscode.commands.registerCommand("Scrummer.addTask", async () => {
		try {
			let webPanel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
				"Scrummer.webPanel",
				"Add new task",
				vscode.ViewColumn.One,
				{
					enableScripts: true
				}
			);

			webPanel.webview.html = getAddNewTaskView();
			webPanel.webview.onDidReceiveMessage((message) => {
				console.log(message);
			});
		}
		catch(e) {
			console.log(e);

			let result: string | undefined = await vscode.window.showErrorMessage("Something wrong happen...", ...["Reload ?"]).then((result) => result);

			if(result === undefined) { return; }

			vscode.commands.executeCommand("workbench.action.reloadWindow");
		}
	});

	vscode.commands.registerCommand("Scrummer.deleteTask", () => {
		vscode.window.showInformationMessage("Deleting Task...");
	});

	vscode.commands.registerCommand("Scrummer.editTask", () => {
		vscode.window.showInformationMessage("Editing Task...");
	});

	vscode.commands.registerCommand("Scrummer.hello", () => {
		vscode.window.showInformationMessage("Hello from Scrummer!");

		console.log(token);
	});
}

function deactivate() {}

export { activate, deactivate };