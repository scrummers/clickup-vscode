import path = require('path');
import { ExtensionContext, Uri } from 'vscode';

export class Resources {
    static icons: Map<string, Uri | { light: Uri; dark: Uri }> = new Map();
    static charlesCert: string;
    static html: Map<string, string> = new Map();
    static htmlNotFound: string = `<!DOCTYPE html>
    <html lang="en">
    <body>
    Resource not found: {{resource}}
    </body>
    </html>`;
}

export enum IconSet {
    AddCircle = 'add-circle',
}

export function registerResources(vscodeContext: ExtensionContext) {
    //   Resources.icons.set(
    //     iconSet.ADDCIRCLE,
    //     Uri.file(
    //       vscodeContext.asAbsolutePath(
    //         path.join("resources", "bitbucket", "add-circle.svg")
    //       )
    //     )
    //   );
}
