import * as vscode from 'vscode';

export enum EnumLocalStorage {
    Token = 'token',
    CrntSpace = 'crnt-space',
    Me = 'me',
    CrntWorkspace = 'crnt-workspace',
}

export enum EnumInitWebRoute {
    ViewTask = 'view-task',
    AddTask = 'add-task',
}

export type CodelensCreateTask = {
    taskname: string,
    position: vscode.Position,
    line: vscode.TextLine,
    matchedLine: number
    range: vscode.Range
}

export enum EnumButtonAction {
    OpenTask = 'Open Task',
    Ok = 'OK'
}