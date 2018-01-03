#!/usr/bin/env node

import {ValidatorModule} from "../compiler/compilerheaders";
import {Info, Operation, Schema, Spec, Tag} from "swagger-schema-official";
import {assign, forIn, omitBy, isNil, set} from "lodash";
import {compileAndSave, COMPILED_SWAGGER_PATH, loadModule} from "./loader";
import {readFileSync} from "fs";
import {join} from "path";
import {FastifyAdaptor} from "./adaptors/fastify-adaptor";
import {ExtendedSchema, RequestFieldMap} from "../compiler/compilerheaders";

const ERRORTABLEHEADER = "|Status Code|Name|Description|\n|-|-|--|\n";
const REDOCPATH = "../../html/index.html";

export interface ApiExchange {
	headers: { [key: string]: any };
	body: any;
	formData: { [key: string]: any };
	query: { [key: string]: any };
	path: { [key: string]: any };
	statusCode: number;
}

export interface ErrorDef {
	code: number;
	defaultMessage: string;
}

export enum HttpMethod {
	POST,
	PUT,
	GET,
	ANY,
	DELETE,
	HEAD,
	PATCH,
}

export interface ApiServer {
	requestFieldMap: RequestFieldMap;
	register: (path: string, method: HttpMethod, handler: (request: ApiExchange) =>
		ApiExchange | Promise<ApiExchange>) => void;
	allowDocSite: boolean;
	getExport: (metadata: ValoryMetadata, options: any) => { valory: ValoryMetadata };
}

export interface ValoryMetadata {
	undocumentedEndpoints: string[];
	valoryPath: string;
	compiledSwaggerPath: string;
	swagger: Spec;
}

const DefaultErrors: { [x: string]: ErrorDef } = {
	ValidationError: {
		code: 1001,
		defaultMessage: "Invalid Parameters",
	},
	TokenMalformed: {
		code: 1002,
		defaultMessage: "Authorization Failure",
	},
};

export class Valory {
	private COMPILERMODE: boolean = (process.env.VALORYCOMPILER === "TRUE");
	private apiDef: Spec;
	private server: ApiServer;
	private validatorModule: ValidatorModule;
	private errors = DefaultErrors;
	private metadata: ValoryMetadata = {
		undocumentedEndpoints: [],
		valoryPath: __dirname,
		compiledSwaggerPath: COMPILED_SWAGGER_PATH,
		swagger: null,
	};

	constructor(info: Info, errors: { [x: string]: ErrorDef }, consumes: string[] = [], produces: string[] = [],
				definitions: { [x: string]: Schema }, tags: Tag[], server: ApiServer = new FastifyAdaptor()) {
		this.apiDef = {
			swagger: "2.0",
			info,
			paths: {},
			definitions,
			tags,
			consumes,
			produces,
		};

		this.server = server;
		assign(this.errors, errors);

		if (!this.COMPILERMODE) {
			try {
				this.validatorModule = loadModule(definitions);
				if (server.allowDocSite) {
					this.registerDocSite();
				}
			} catch (err) {
				throw Error("Missing compiled swagger file. Please run valory CLI.");
			}
		} else {
			this.apiDef.tags.push(generateErrorTable(this.errors));
		}
	}

	public endpoint(path: string, method: HttpMethod, swaggerDef: Operation, secure: boolean = false,
					documented: boolean = true) {
		if (this.COMPILERMODE) {
			this.endpointCompile(path, method, swaggerDef, secure, documented);
		} else {
			this.endpointRun(path, method, swaggerDef, secure, documented);
		}
	}

	public start(options: any): { valory: ValoryMetadata } {
		this.metadata.swagger = this.apiDef;
		return this.server.getExport(this.metadata, options);
	}

	private endpointCompile(path: string, method: HttpMethod, swaggerDef: Operation, secure: boolean = false,
							documented: boolean = true) {
		// TODO: add undocumented support
		set(this.apiDef.paths, `${path}.${HttpMethod[method].toLowerCase()}`, swaggerDef);
	}

	private endpointRun(path: string, method: HttpMethod, swaggerDef: Operation, secure: boolean = false,
						documented: boolean = true) {

	}

	private registerDocSite() {
		const redoc = readFileSync(join(__dirname, REDOCPATH), {encoding: "utf8"});
		const swaggerBlob = this.validatorModule.swaggerBlob;
		this.server.register("/swagger.json", HttpMethod.GET, (req) => {
			return {
				body: swaggerBlob,
				headers: {"Content-Type": "text/plain"},
				query: null,
				path: null,
				statusCode: 200,
				formData: null,
			};
		});
		this.server.register("/", HttpMethod.GET, (req) => {
			return {
				body: redoc,
				headers: {"Content-Type": "text/html"},
				query: null,
				path: null,
				statusCode: 200,
				formData: null,
			};
		});
	}
}

function generateErrorTable(errors: { [x: string]: ErrorDef }): Tag {
	const tagDef: Tag = {name: "Errors", description: "", externalDocs: null};
	let table = ERRORTABLEHEADER;
	forIn(errors, (error: ErrorDef, name: string) => {
		"use strict";
		table += "|" + error.code + "|" + name + "|" + error.defaultMessage + "|\n";
	});
	tagDef.description = table;
	return omitBy(tagDef, isNil) as Tag;
}

if (!module.parent) {
	process.env.VALORYCOMPILER = "TRUE";
	const relative = require("require-relative");
	const args = require("nomnom").options({
		entrypoint: {
			position: 0,
			help: "Main entrypoint for the api",
			required: true,
		},
		host: {
			position: 1,
			help: "The host for your api e.g. somewebsite.com",
		},
		scheme: {
			abbr: "s",
			help: "The access method for your api. e.g. https",
			default: "https",
		},
		basePath: {
			abbr: "r",
			help: "Api path relative to the host. It must start with a slash. e.g. /store/dev",
			callback: (resourcePath: string) => {
				return (resourcePath.startsWith("/")) ? true : "Resource path MUST start with a '/'";
			},
			required: true,
			default: "/",
		},
		outputFile: {
			abbr: "o",
			help: "File to write output to",
			default: join(process.cwd(), "swagger.json"),
		},
		version: {
			abbr: "v",
			help: "Api version string e.g. '1.0.0'",
			required: true,
			transform: (v: number) => {
				return v.toString();
			},
		},
		compilationLevel: {
			abbr: "l",
			help: "Compilation level ['SIMPLE', 'ADVANCED', 'WHITESPACE_ONLY']",
			required: true,
			default: "ADVANCED",
			callback: (level: string) => {
				"use strict";
				return (["SIMPLE", "ADVANCED", "WHITESPACE_ONLY"]
					.indexOf(level) > -1) ? true : "Must be one of [\"SIMPLE\", \"ADVANCED\", \"WHITESPACE_ONLY\"]";
			},
			enum: ["SIMPLE", "ADVANCED", "WHITESPACE_ONLY"],
		},
		debugMode: {
			abbr: "d",
			help: "Enable debug mode for the compiler",
			default: false,
			flag: true,
		},
	}).parse();
	args.entrypoint = (args.entrypoint.startsWith("/") || args.entrypoint.startsWith("."))
		? args.entrypoint : "./" + args.entrypoint;
	const valExport: {valory: ValoryMetadata} = relative(args.entrypoint, process.cwd());
	const api = valExport.valory.swagger;
	api.schemes = args.schemes;
	api.host = args.host;
	api.info.version = args.version;
	const output = omitBy(api, isNil) as Spec;
	compileAndSave(output, valExport.valory.compiledSwaggerPath, process.cwd(),
		valExport.valory.undocumentedEndpoints, {debug: args.debugMode, compilationLevel: args.compilation_level})
		.then(() => {console.log("done"); process.exit(0); });
}
