import {readFileSync} from "fs";
import {OpenAPIV3} from "openapi-types";
import * as path from "path";
import {JSONSchema7} from "json-schema";
import ajv = require("ajv");
import {IPackageJSON} from "package-json";
import {CompilerOptions} from "../compiler/spec-compiler/spec-compiler";

export const METADATA_VERSION = 2;
export const COMPSWAG_VERSION = 2;
export const ROUTES_VERSION = 2;

export interface ValoryMetadata {
    openapi: OpenAPIV3.Document
    version: number
}

export interface ValoryConfig {
    entrypoint: string;
    outputDirectory: string;
    specOutput: string;
    compilerOptions: Partial<CompilerOptions>
}

const ConfigSchema: JSONSchema7 = {
    type: "object",
    properties: {
        entrypoint: {
            type: "string"
        },
        outputDirectory: {
            type: "string"
        },
        specOutput: {
            type: "string"
        },
        compilerOptions: {
            type: "object",
            properties: {
                allErrors: {
                    type: "boolean"
                },
                coerceTypes: {
                    oneOf: [
                        {type: "boolean"},
                        {type: "string", const: "array"}
                    ]
                },
                prepackErrors: {
                    type: "boolean"
                }
            }
        }
    },
    required: ["entrypoint", "outputDirectory"]
};

export namespace Config {
    export const VALORY_COMPILE_MODE_VAR = "VALORY_COMPILE_MODE";
    export const VALORY_METADATA_VAR = "VALORY_METADATA";
    export const VALORY_DEFAULT_ADAPTOR_VAR = "VALORY_DEFAULT_ADAPTOR";
    export const CONFIG_FILE = "valory.json";
    export let CompileMode = false;
    export let RootPath = "";
    export let PackageJSONPath = "";
    export let PackageJSON: IPackageJSON;
    export let ConfigPath = "";
    export let ConfigData: ValoryConfig;
    export let CLIMode = false;

    export function load(cliMode: boolean, rootPath?: string, loadConfig: boolean = false) {
        CompileMode = process.env[VALORY_COMPILE_MODE_VAR] === "TRUE";
        CLIMode = cliMode;
        RootPath = rootPath || resolveRootPath();
        ConfigPath = path.join(RootPath, CONFIG_FILE);
        PackageJSONPath = path.join(RootPath, "package.json");
        if (loadConfig) {
            ConfigData = loadValidatedConfig(ConfigPath);
            PackageJSON = require(PackageJSONPath);
        }
    }

    function loadValidatedConfig(configPath: string) {
        const data = JSON.parse(readFileSync(configPath, {encoding: "utf8"}));
        if (!ajv().validate(ConfigSchema, data)) {
            throw Error("Config is invalid")
        }
        return data
    }

    export function setCompileMode(flag: boolean) {
        process.env[VALORY_COMPILE_MODE_VAR] = flag ? "TRUE" : "FALSE"
    }

    export function setMetadata(metadata: ValoryMetadata) {
        process.env[VALORY_METADATA_VAR] = JSON.stringify(metadata)
    }

    export function getMetadata(): ValoryMetadata {
        let metadata: ValoryMetadata;
        try {
             metadata = JSON.parse(process.env[VALORY_METADATA_VAR])
        } catch (e) {
            throw Error("Could not parse metadata")
        }
        if (metadata.version !== METADATA_VERSION) {
            throw Error(`Metadata version mismatch. required: ${METADATA_VERSION} actual: ${metadata.version}`)
        }
        return metadata;
    }

    export function setDefaultAdaptorPath(defaultAdaptorPath: string) {
        process.env[VALORY_DEFAULT_ADAPTOR_VAR] = defaultAdaptorPath;
    }

    export function getDefaultAdaptorPath(): string | null {
        return process.env[VALORY_DEFAULT_ADAPTOR_VAR];
    }

    export function resolveEntryPoint() {
        return path.join(RootPath, ConfigData.entrypoint);
    }

    export function resolveOutputDirectory() {
        return path.join(RootPath, ConfigData.outputDirectory);
    }

    export function resolveSpecOutput() {
        return (ConfigData.specOutput) ? path.join(RootPath, ConfigData.specOutput) : null
    }

    function resolveRootPath() {
        return __dirname.split("node_modules")[0]
    }
}
