import {Schema, Spec} from "swagger-schema-official";

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
	validate: (path: string, method: string, data: any) => string | string[];
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
		preSwagger: Spec;
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
}

export const FUNCTION_PREFIX = "f";