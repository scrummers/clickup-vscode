import * as vscode from 'vscode';

/**
 * CodelensProvider
 */
export class CodelensProvider implements vscode.CodeLensProvider {

    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    private enable: boolean;
    constructor() {
        this.regex = /CTODO \{(.+)\}/g; //Search CTODO {taskname}

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
                const match_line = document.positionAt(matches.index).line;     
                const file_path  = document.uri.path;       
                const line = document.lineAt(document.positionAt(matches.index).line);
                const indexOf = line.text.indexOf(matches[0]);
                const position = new vscode.Position(line.lineNumber, indexOf);
                const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                const pass_argv={match_line, taskname, file_path};
                if (range) {
                    var codeLen_Obj = new vscode.CodeLens(range);
                    codeLen_Obj.command = {
                        title: "Add Task: " + taskname,
                        tooltip: "Click to add Task",
                        command: "clickup.testing",
                        arguments: [pass_argv, false]
                    };
                    this.codeLenses.push(codeLen_Obj);
                }
            }
            return this.codeLenses;
        }
        return [];
    }

    public codeLensEnable(){
        this.enable = true;
    }
    public codeLensDisable(){
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
