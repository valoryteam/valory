import {Schema, Spec} from "swagger-schema-official";

export const HASH_SEED = 3141997;

export interface ExtendedSchema extends Schema {
	const?: any;
	oneOf?: ExtendedSchema[];
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

export type ValidatorModuleContent = string;

export interface MangledKey {
	original: string;
	mangled: string;
}

export interface CompilerOutput {
	module: ValidatorModuleContent;
	debugArtifacts?: {
		hashes: string[];
		preSwagger: {swagger: Spec, discriminators: string[]};
		derefSwagger: Spec;
		initialSchema: ExtendedSchema[];
		processedSchema: ExtendedSchema[];
		initialCompiles: any[];
		mangledSchema: Array<{ schema: ExtendedSchema, mangledKeys: MangledKey[] }>;
		intermediateFunctions: string[];
		intermediateModule: ValidatorModuleContent;
		postCompileModule: ValidatorModuleContent;
		closureOutput: { stdout: string, stderr: string, exitCode: number };
	};
}

export enum CompilationLevel {
	"ADVANCED",
	"WHITESPACE_ONLY",
	"SIMPLE",
}

export interface ICompilerOptions {
	debug?: boolean;
	requestFieldMapping?: RequestFieldMap;
	compilationLevel?: CompilationLevel;
	singleError?: boolean;
}

export const FUNCTION_PREFIX = "f";
