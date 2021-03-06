import {existsSync, mkdirSync, writeFileSync} from "fs";
import * as path from "path";

export interface ModuleBuilderInputs {
    modules: {[name: string]: string};
    destinationPath: string;
    globalVar: string;
}

const FILE_HEADER = `
////////////////////////////////////////////////////////
// ___   ___    _  _  ___ _____   ___ ___ ___ _____   //
// |   \\ / _ \\  | \\| |/ _ \\_   _| | __|   \\_ _|_   _| //
// | |) | (_) | | .\` | (_) || |   | _|| |) | |  | |   //
// |___/ \\___/  |_|\\_|\\___/ |_|   |___|___/___| |_|   //
//                                                    //
// This file was generated by valory and should not   //
// be directly edited.                                //
////////////////////////////////////////////////////////

`;

export class ModuleBuilder {
    constructor(
        private readonly input: ModuleBuilderInputs
    ) {}

    public generate() {
        this.prepareDirectory();
        const files = this.getFiles();
        this.saveFiles(files);
    }

    private saveFiles(files: [string, string][]) {
        files.forEach(([name, content]) => {
            writeFileSync(`${this.resolveFilePath(name)}.ts`, FILE_HEADER + content);
        });
    }

    private resolveFilePath(name: string) {
        return path.join(this.input.destinationPath, name);
    }

    private getFiles(): [string, string][] {
        return [...Object.entries(this.input.modules), ["index", this.generateIndex()]];
    }

    private prepareDirectory() {
        if (!existsSync(this.input.destinationPath)) {
            mkdirSync(this.input.destinationPath);
        }

    }

    private generateIndex() {
        return `
        // @ts-nocheck
        /* tslint:disable */
        global["${this.input.globalVar}"] = {
            ${Object.keys(this.input.modules).map(file => `"${file}": require("./${file}")`).join(",")}
        };
        `;
    }
}
