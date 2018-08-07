import { ThreadSpinner } from "thread-spin";
import { IPackageJSON } from "./package";
export declare const CLI_MODE_FLAG = "VALORY_CLI";
export declare const VALORY_ROOT = "VALORY_ROOT";
export interface ValoryConfig {
    entrypoint: string;
    sourceEntrypoint?: string;
    basePath?: string;
    singleError?: boolean;
}
export declare namespace Config {
    const CONFIG_FILE = "valory.json";
    const SWAGGER_FILE = "swagger.json";
    const COMPILED_SWAGGER_FILE = ".compswag.js";
    const GENERATED_ROUTES_FILE = "generatedRoutes.ts";
    const COMPILED_ROUTES_FILE = "generatedRoutes.js";
    let RootPath: string;
    let CompilerMode: boolean;
    let Spinner: ThreadSpinner;
    let Loaded: boolean;
    let ConfigPath: string;
    let SwaggerPath: string;
    let CompSwagPath: string;
    let ConfigData: ValoryConfig;
    let PackageJSON: IPackageJSON;
    let ValoryVersion: string;
    let GeneratedRoutePath: string;
    let SourceRoutePath: string;
    let PackageJSONPath: string;
    function load(loadConfig?: boolean, root?: string): void;
    function checkRequirements(): Promise<void>;
}
