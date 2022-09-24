import { LocalStorageService } from "./service/local_storage_service";
import { deleteClickUpToken, getClickUpToken } from "./utils/click_up_utils";
import * as vscode from "vscode";
import { resourceLimits } from "worker_threads";

export async function activate(context: vscode.ExtensionContext) {
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

			let userToken: string | undefined = await getClickUpToken();

			if(userToken === "") { return vscode.window.showErrorMessage("Please input your Click Up Token to use Scrummer"); }

			storageService.setValue("token", userToken);
		});
	}

	// Command function
	vscode.commands.registerCommand("Scrummer.addClickUpToken", async () => {
		let userToken: string | undefined = await getClickUpToken();

		if(userToken === "") { return vscode.window.showErrorMessage("Please input your Click Up token to use Scrummer"); }

		storageService.setValue("token", userToken);
	});

	vscode.commands.registerCommand("Scrummer.deleteClickUpToken", async () => {
		let result: string | undefined = await deleteClickUpToken();

		if(result === undefined || result === "No") { return; }

		storageService.deleteValue("token");
	});

	vscode.commands.registerCommand("Scrummer.editClickUpToken", () => {
		vscode.window.showInformationMessage("Editing Click Up token...");
	});

	vscode.commands.registerCommand("Scrummer.addTask", () => {
		vscode.window.showInformationMessage("Adding Task...");
	});

	vscode.commands.registerCommand("Scrummer.deleteTask", () => {
		vscode.window.showInformationMessage("Deleting Task...");
	});

	vscode.commands.registerCommand("Scrummer.editTask", () => {
		vscode.window.showInformationMessage("Editing Task...")
	});

	vscode.commands.registerCommand("Scrummer.hello", () => {
		vscode.window.showInformationMessage("Hello from Scrummer!");

		console.log(token);
	});
}

export function deactivate() {}
