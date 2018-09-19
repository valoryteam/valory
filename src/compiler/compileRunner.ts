import P = require("pino");
import {Swagger} from "../server/swagger";
import {CompilerOutput, ICompilerOptions} from "./compilerheaders";
import {VALORYLOGGERVAR, VALORYPRETTYLOGGERVAR} from "../server/valoryheaders";
import {existsSync, mkdirSync, writeFileSync} from "fs";
import {cloneDeep, omit} from "lodash";
import * as path from "path";
import {Config} from "../lib/config";

const hyperid = require("hyperid");

export async function compileAndSave(swagger: Swagger.Spec, compilePath: string, additionalPath: string
    , undocumentedPaths: string[], compilerOptions: ICompilerOptions, debugPath?: string) {
    const compiled = await require("./compiler").compile(swagger, compilerOptions);
    const Logger = P({
        level: process.env[VALORYLOGGERVAR] || "info",
        prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true",
    });
    if (debugPath != null) {
        if (!existsSync(debugPath)) {
            mkdirSync(debugPath);
        }
        const id = Buffer.from(hyperid()()).toString("base64");
        mkdirSync(path.join(debugPath, id));
        Logger.info("Placing additional debug artifacts in:", path.join(debugPath, id));
        for (const name of Object.keys(compiled.debugArtifacts)) {
            const item = compiled.debugArtifacts[name];
            const out = processDebugArtifact(item, (name as keyof CompilerOutput["debugArtifacts"]));
            writeFileSync(path.join(debugPath, id, name + out.extension), out.content);
        }
    }
    if (compiled.success) {
        Logger.debug("Saving compiled swagger to: " + compilePath);
        writeFileSync(compilePath, compiled.module);
        const trimmedSpec = cloneDeep(swagger);
        trimmedSpec.paths = omit(trimmedSpec.paths, undocumentedPaths);
        writeFileSync(Config.SwaggerPath, JSON.stringify(trimmedSpec));
        writeFileSync(path.join(additionalPath, Config.SWAGGER_FILE), JSON.stringify(trimmedSpec));
    }
}

function processDebugArtifact<K extends keyof CompilerOutput["debugArtifacts"]>(
    item: CompilerOutput["debugArtifacts"][K], name: K): {content: string, extension: string} {
    switch (name) {
        case "intermediateModule":
        case "postCompileModule":
            return {
                content: item as string,
                extension: ".js",
            };
        case "closureOutput":
        case "derefSwagger":
        case "hashes":
        case "initialSchema":
        case "mangledSchema":
        case "preSwagger":
        case "serializerHashes":
        case "processedSchema":
            return {
                content: JSON.stringify(item),
                extension: ".json",
            };
        case "serializers":
        case "initialCompiles":
        case "intermediateFunctions":
            return {
                content: (item as any[]).join("\n\n"),
                extension: ".js",
            };
        default:
            console.log("unknown artifact", name);
    }
}
