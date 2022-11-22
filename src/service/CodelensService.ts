import path from 'path';
import * as vscode from 'vscode';
import { Commands } from '../commands';
import { CodelensCreateTask } from '../util/typings/system';

export class CodelensService implements vscode.CodeLensProvider {

    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    private enable: boolean;
    constructor() {
        this.regex = /todo:\s(.+)/g; // Search todo {taskname}

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
        this.enable = true;
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

        if (this.enable == true) {
            this.codeLenses = [];
            const regex = new RegExp(this.regex);
            const text = document.getText();

            let matches;
            while ((matches = regex.exec(text)) !== null) {
                const taskname = matches[1];

                const taskIdMatch = taskname.match(/#(.+)$/g)
                const taskId = taskIdMatch ? taskIdMatch[0].substring(1) : ''

                const matchedLine = document.positionAt(matches.index).line;
                // const filePath = document.uri.path;
                const line = document.lineAt(document.positionAt(matches.index).line);
                const indexOf = line.text.indexOf(matches[0]);
                const position = new vscode.Position(line.lineNumber, indexOf);
                const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));

                if (range) {
                    const codeLens = new vscode.CodeLens(range);
                    if (taskId) {
                        codeLens.command = {
                            title: `View ClickUp Task #${taskId}`,
                            // tooltip: "Click to View ClickUp Task",
                            command: Commands.ClickupViewTask,
                            arguments: [{
                                taskId
                            }, false]
                        };
                    } else {
                        codeLens.command = {
                            title: "Add ClickUp Task: " + taskname,
                            tooltip: "Click to Create Task",
                            command: Commands.ClickupQuickAddTask,
                            arguments: [{
                                matchedLine,
                                taskname,
                                position,
                                line,
                            } as CodelensCreateTask, false]
                        };
                    }
                    this.codeLenses.push(codeLens);
                }
            }
            return this.codeLenses;
        }
        return [];
    }

    public codeLensEnable() {
        this.enable = true;
    }
    public codeLensDisable() {
        this.enable = false;
    }
    /*
        public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
            if (vscode.workspace.getConfiguration("codelens-sample").get("enableCodeLens", true)) {
                codeLens.command = {
                    title: "Codelens CTODO MATCHED",
                    tooltip: "Tooltip provided by sample extension",
                    command: "clickup.testing",
                    arguments: ["Argument 1", false]
                };
                return codeLens;
            }
            return null;
        }
    */
}
