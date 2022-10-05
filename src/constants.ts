import { commands } from 'vscode';

export const extensionId = 'clickup';
export const extensionOutputChannelName = 'Clickup';

export enum CommandContext {}

export function setCommandContext(key: CommandContext | string, value: any) {
    return commands.executeCommand('setContext', key, value);
}
