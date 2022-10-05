import { commands, ExtensionContext } from 'vscode';

export enum Commands {
    // temp

    // Config
    ClickupSetToken = 'clickup.setToken',
    ClickupUpdateToken = 'clickup.updateToken',
    ClickupDeleteToken = 'clickup.deleteToken',

    // Task
    ClickupAddTask = 'clickup.addTask',
    ClickupEditTask = 'clickup.editTask',
    ClickupDeleteTask = 'clickup.deleteTask',
}

export function registerCommands(vscodeContext: ExtensionContext) {
    vscodeContext.subscriptions.push(commands.registerCommand(Commands.ClickupAddTask, () => console.log('add task')));
}
