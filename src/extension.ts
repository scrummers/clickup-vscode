import { Commands } from "./commands";
import { ClickUpService } from "./service/click_up_service";
import { LocalStorageService } from "./service/local_storage_service";
import { TreeViewService } from "./service/tree_view_service";
import { WebViewService } from "./service/web_view_service";
import { TaskFilter} from "./util/typings/clickup";
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

		let webFolder: string = "add_new_task";

		let addTaskWebViewer = new WebViewService(context, [webFolder, "add_new_task.html"], "Add New Task", {
			localResources: [webFolder],
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

		console.log(vscode.Uri.file(path.join(context.extensionPath, "html", "add_new_task")));
	});

	vscode.commands.registerCommand("Scrummer.testing",  async () => {
		// For testing purposes and examples for each features
		const space = await clickUpService.getSpaceTree("55543351");
		console.log(space);
		const TestSpace = await clickUpService.getSpaceTree("55594352");
		console.log(TestSpace);
		const ALL_tasks = await clickUpService.getTasksFilters([], TestSpace, TaskFilter.Type_all_task); // Return ALL To-do Task
		const tasks = await clickUpService.getTasksFilters([49541582], TestSpace, TaskFilter.Type_all_task); // Return Wilson To-do Task
		const Jtasks = await clickUpService.getTasksFilters([5883240], TestSpace, TaskFilter.Type_all_task); // Return Jacky To-do Task
		const ALL_tasks_sp = await clickUpService.getTasksFilters([], space, TaskFilter.Type_all_task); // Return ALL To-do Task
		const done_tasks = await clickUpService.getTasksFilters([], space, "done"); // Return done Task
		const overdue_tasks = await clickUpService.getTasksFilters([], TestSpace, TaskFilter.Type_overdue); // Return overdue Task
		const today_tasks = await clickUpService.getTasksFilters([], TestSpace, TaskFilter.Type_today); // Return overdue Task
		const join_tasks = await clickUpService.getTasksFilters([49541582, 5883240], TestSpace, TaskFilter.Type_all_task); // Return next Task
		console.log(ALL_tasks);
		console.log(tasks);
		console.log(Jtasks);
		console.log(ALL_tasks_sp);
		console.log(done_tasks);
		console.log(overdue_tasks);
	});
}

function deactivate() {}

export {
	activate,
	deactivate
};