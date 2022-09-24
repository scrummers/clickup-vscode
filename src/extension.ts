import { LocalStorageService } from "./service/local_storage_service";
import * as vscode from "vscode";

export async function activate(context: vscode.ExtensionContext) {
	console.log("\"Scrummer\" is now active!");

	// Load data from local storage
	let storageService: LocalStorageService = new LocalStorageService(context.workspaceState);

	let token: string = await storageService.getValue("token");

	if(token === undefined)	{
		vscode.window.showErrorMessage("No ClickUp Token!", ...["Add Click Up Token"]).then((result) => {
			if(result === undefined) { return; }

			console.log(result);
		});
	}

	// Command function
	vscode.commands.registerCommand("Scrummer.addClickUpToken", () => {
		vscode.window.showInformationMessage("Adding Click Up token...");
	});

	vscode.commands.registerCommand("Scrummer.helloWorld", () => {
		vscode.window.showInformationMessage("Hello World from Scrummer!");
	});
}

export function deactivate() {}
