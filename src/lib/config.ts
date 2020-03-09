import {readFileSync} from "fs";
import {OpenAPIV3} from "openapi-types";
import * as path from "path";
import {JSONSchema7} from "json-schema";
import ajv = require("ajv");

export const METADATA_VERSION = 2;
export const COMPSWAG_VERSION = 2;

export interface ValoryMetadata {
    openapi: OpenAPIV3.Document
    version: number
}

export interface ValoryConfig {
    entrypoint: string;
    outputDirectory: string;
    swaggerOutput: string;
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
        swaggerOutput: {
            type: "string"
        }
    },
    required: ["entrypoint", "outputDirectory"]
};

export namespace Config {
    export const VALORY_COMPILE_MODE_VAR = "VALORY_COMPILE_MODE";
    export const VALORY_METADATA_VAR = "VALORY_METADATA";
    export const CONFIG_FILE = "valory.json";
    export let CompileMode = false;
    export let RootPath = "";
    export let ConfigPath = "";
    export let ConfigData: ValoryConfig;
    export let CLIMode = false;

    export function load(cliMode: boolean, rootPath?: string, loadConfig: boolean = false) {
        CompileMode = process.env[VALORY_COMPILE_MODE_VAR] === "TRUE";
        CLIMode = cliMode;
        RootPath = rootPath || resolveRootPath();
        ConfigPath = path.join(RootPath, CONFIG_FILE);
        if (loadConfig) {
            ConfigData = loadValidatedConfig(ConfigPath)
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

    export function resolveEntryPoint() {
        return path.join(RootPath, ConfigData.entrypoint);
    }

    export function resolveOutputDirectory() {
        return path.join(RootPath, ConfigData.outputDirectory);
    }

    function resolveRootPath() {
        return __dirname.split("node_modules")[0]
    }
}
