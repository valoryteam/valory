import {existsSync, readFileSync, writeFileSync} from "fs";
import {OpenAPIV3} from "openapi-types";
import * as path from "path";
import {JSONSchema7} from "json-schema";
import {IPackageJSON} from "package-json";
import {CompilerOptions} from "../compiler/spec-compiler/spec-compiler";
import {LOGGER_VAR, METADATA_VERSION, VALORY_DEFAULT_ADAPTOR_VAR, VALORY_METADATA_VAR} from "./common/headers";
import ajv = require("ajv");
import {merge} from "lodash";
import * as Pino from "pino";
import {parse as yamlParse, stringify as yamlStringify} from "yaml";

export interface ValoryMetadata {
    openapi: OpenAPIV3.Document;
    version: number;
}

export interface ValoryConfig {
    entrypoint: string;
    outputDirectory: string;
    specOutput?: string;
    compilerOptions: Partial<CompilerOptions>;
    spec: Partial<OpenAPIV3.Document>;
    cors: {
        allowedHeaders: string[];
    };
}

export const DefaultConfig: Partial<ValoryConfig> = {
    compilerOptions: {
        excludeResponses: false,
        prepackErrors: true,
        coerceTypes: false,
        allErrors: false
    },
    spec: {
        info: {
            title: "Default Title",
            version: "1"
        }
    },
    cors: {
        allowedHeaders: ["Content-Type"]
    }
};

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
                    anyOf: [
                        {type: "boolean"},
                        {const: "array"}
                    ]
                },
                prepackErrors: {
                    type: "boolean"
                },
                excludeResponses: {
                    type: "boolean"
                }
            }
        },
        spec: {
            type: "object",
            additionalItems: true
        },
        cors: {
            type: "object",
            properties: {
                allowedHeaders: {
                    type: "array",
                    items: {
                        type: "string"
                    }
                }
            }
        }
    },
    required: ["entrypoint", "outputDirectory"]
};

export const CONFIG_FILE = ["valory.yaml", "valory.json"];

export namespace Config {
    export let RootPath = "";
    export let PackageJSONPath = "";
    export let PackageJSON: IPackageJSON;
    export let ConfigPath = "";
    export let ConfigData: ValoryConfig;
    export let CLIMode = false;
    export let Logger = Pino({level: process.env[LOGGER_VAR] || "info"});

    export function load(cliMode: boolean, rootPath?: string, loadConfig: boolean = false) {
        CLIMode = cliMode;
        RootPath = rootPath || resolveRootPath();
        ConfigPath = resolveConfigPath(RootPath);
        PackageJSONPath = path.join(RootPath, "package.json");
        if (loadConfig) {
            ConfigData = loadValidatedConfig(ConfigPath);
            PackageJSON = require(PackageJSONPath);
        }
    }

    function resolveConfigPath(rootPath: string) {
        const paths = CONFIG_FILE.map(file => path.join(rootPath, file));
        for (const configPath of paths) {
            if (existsSync(configPath)) {
                return configPath;
            }
        }
        return CONFIG_FILE[0];
    }

    function parseConfig(configPath: string) {
        const data = readFileSync(configPath, {encoding: "utf8"});
        const ext = path.extname(configPath);
        switch (ext) {
            case ".json":
                return JSON.parse(data);
            case ".yaml":
                return yamlParse(data, {});
        }
    }

    export function saveConfig(config: ValoryConfig) {
        let data = "";
        switch (path.extname(ConfigPath)) {
            case ".yaml":
                data = yamlStringify(config);
                break;
            case ".json":
                data = JSON.stringify(config, null, 4);
                break;
        }
        writeFileSync(ConfigPath, data);
    }

    function loadValidatedConfig(configPath: string) {
        const data = merge(DefaultConfig, parseConfig(configPath));
        if (!ajv({
            useDefaults: "shared",
            removeAdditional: "all"
        }).validate(ConfigSchema, data)) {
            throw Error("Config is invalid");
        }

        return data;
    }

    export function setMetadata(metadata: ValoryMetadata) {
        process.env[VALORY_METADATA_VAR] = JSON.stringify(metadata);
    }

    export function getMetadata(): ValoryMetadata {
        let metadata: ValoryMetadata;
        try {
             metadata = JSON.parse(process.env[VALORY_METADATA_VAR]);
        } catch (e) {
            throw Error("Could not parse metadata");
        }
        if (metadata.version !== METADATA_VERSION) {
            throw Error(`Metadata version mismatch. required: ${METADATA_VERSION} actual: ${metadata.version}`);
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
        return (ConfigData.specOutput) ? path.join(RootPath, ConfigData.specOutput) : null;
    }

    function resolveRootPath() {
        return __dirname.split("node_modules")[0];
    }
}
