import {Swagger} from "../server/swagger";

export const HASH_SEED = 3141997;

export interface ExtendedSchema extends Swagger.Schema {
	const?: any;
	oneOf?: ExtendedSchema[];
	anyOf?: ExtendedSchema[];
}

export type Validator = (data: any) => string | string[] | boolean;
export type Serializer = (data: any) => string;

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
	getValidator: (path: string, method: string) => {
		validator: Validator,
		serializer?: Serializer,
	};
}

export type ValidatorModuleContent = string;

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
		serializerHashes: string[];
		preSwagger: { swagger: Swagger.Spec, discriminators: DiscriminatorMap };
		derefSwagger: Swagger.Spec;
		initialSchema: ExtendedSchema[];
		processedSchema: ExtendedSchema[];
		initialCompiles: any[];
		mangledSchema: Array<{ schema: ExtendedSchema, mangledKeys: MangledKey[] }>;
		serializers: string[];
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
	discrimFastFail?: boolean;
	disableSerialization?: string[];
}

export const FUNCTION_PREFIX = "f";
export const SERIALIZER_SUFFIX = "s";
