import {readFileSync, readSync} from "fs";

export const METADATA_VERSION = 2;

export interface ValoryConfig {
    entrypoint: string;
    outputDirectory: string;
    swaggerOutput: string;
}

export namespace Config {
    export const VALORY_COMPILE_MODE_VAR = "VALORY_COMPILE_MODE";
    export const VALORY_METADATA_VAR = "VALORY_METADATA";
    export const CONFIG_FILE = "valory.json";
    export const CompileMode = process.env[VALORY_COMPILE_MODE_VAR];
    export let RootPath = "";
    export let ConfigPath = "";
    export let ConfigData: ValoryConfig;
    export let CLIMode = false;

    export function load(cliMode: boolean, rootPath?: string, loadConfig: boolean = false) {
        CLIMode = cliMode;
        RootPath = rootPath || resolveRootPath();
        ConfigPath = `${RootPath}/${CONFIG_FILE}`;
        if (loadConfig) {
            ConfigData = JSON.parse(readFileSync(ConfigPath, {encoding: "utf8"}))
        }
    }

    function resolveRootPath() {
        return __dirname.split("node_modules")[0]
    }
}
