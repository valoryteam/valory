import {ExtendedSchema, RequestFieldMap} from "../compiler/compiler";
import {Info, Schema, Spec, Tag} from "swagger-schema-official";
import {assign} from "lodash";

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
	register: (method: HttpMethod, path: string, handler: (request: any) => any | Promise<any>) => void;
	instance: any;
}

const DefaultErrors: {[x: string]: ErrorDef} = {
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
	private apiDef: Spec;
	private server: ApiServer;
	private errors = DefaultErrors;

	constructor(info: Info, errors: {[x: string]: ErrorDef}, consumes: string[] = [], produces: string[] = [],
				definitions: {[x: string]: Schema}, tags: Tag[], server?: ApiServer) {
		this.apiDef = {
			swagger: "2.0",
			info,
			paths: {},
			definitions,
			tags,
			consumes,
			produces,
		};

		assign(this.errors, errors);


	}
}