import { Swagger } from "../server/swagger";
export declare const HASH_SEED = 3141997;
export interface ExtendedSchema extends Swagger.Schema {
    const?: any;
    oneOf?: ExtendedSchema[];
    anyOf?: ExtendedSchema[];
}
export interface RequestFieldMap {
    header: string;
    body: string;
    formData: string;
    query: string;
    path: string;
    [key: string]: string;
}
export interface ValidatorModule {
    defHash: string;
    globalConsume: string[];
    swaggerBlob: string;
    getValidator: (path: string, method: string) => (data: any) => string | string[] | boolean;
}
export declare type ValidatorModuleContent = string;
export interface MangledKey {
    original: string;
    mangled: string;
}
export interface DiscriminatorMap {
    [propName: string]: {
        parent: string;
        children: string[];
    };
}
export interface CompilerOutput {
    module: ValidatorModuleContent;
    debugArtifacts?: {
        hashes: string[];
        preSwagger: {
            swagger: Swagger.Spec;
            discriminators: DiscriminatorMap;
        };
        derefSwagger: Swagger.Spec;
        initialSchema: ExtendedSchema[];
        processedSchema: ExtendedSchema[];
        initialCompiles: any[];
        mangledSchema: Array<{
            schema: ExtendedSchema;
            mangledKeys: MangledKey[];
        }>;
        intermediateFunctions: string[];
        intermediateModule: ValidatorModuleContent;
        postCompileModule: ValidatorModuleContent;
        closureOutput: {
            stdout: string;
            stderr: string;
            exitCode: number;
        };
    };
}
export declare enum CompilationLevel {
    "ADVANCED" = 0,
    "WHITESPACE_ONLY" = 1,
    "SIMPLE" = 2
}
export interface ICompilerOptions {
    debug?: boolean;
    requestFieldMapping?: RequestFieldMap;
    compilationLevel?: CompilationLevel;
    singleError?: boolean;
    discrimFastFail?: boolean;
}
export declare const FUNCTION_PREFIX = "f";
