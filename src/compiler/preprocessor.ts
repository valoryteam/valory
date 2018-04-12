import {cloneDeep, forEach, get, map, set, unset} from "lodash";
import {Spec} from "swagger-schema-official";
import {CompileLog, DisallowedFormats} from "./compiler";
import {ExtendedSchema, HASH_SEED, MangledKey} from "./compilerheaders";
import {PriorityQueue} from "tstl";

const mergeAllOf = require("json-schema-merge-allof");
const mapKeysDeep: <T>(obj: T, callback: (value: any, key: string) => string) => T = require("map-keys-deep-lodash");

const deep: Deep = require("lodash-deep");
const XXH = require("xxhashjs");

const MANGLED_PREFIX = "p";
const periodRegex = /[.]+?/g;
const allOfRefRegex = /.allOf.[\d]+?.\$ref/g;
const variantTestRegex = /definitions.([^.]*).allOf.[\d]+?.\$ref/g;
const getAllOfRefIndexRegex = /allOf.([^.]*).\$ref/g;
const safeKey = /^(?:[A-Za-z_$])(?:[0-9a-zA-Z_$]*)$/;

interface Deep {
	deepMapValues<T>(obj: T, callback: (value: any, path: string) => any): T;
}

export interface OneOfMarker {
	depth: number;
	schema: ExtendedSchema;
}

export function swaggerPreproccess(swagger: Spec): {swagger: Spec, discriminators: string[]} {
	const pathMap: {[key: string]: {propName: string, oneOfPath: string}} = {};
	const removePaths: string[] = [];

	// DISCRIMINATOR PROCESSING

	// Find parents
	deep.deepMapValues(swagger, (value, path) => {
		if (path.indexOf("discriminator") > -1) {
			// console.log(path, "is", value);
			removePaths.push(path);
			const disPath = path.replace(".discriminator", "");
			const oneOfPath = disPath + ".oneOf";
			const pathRef = "#/" + disPath.replace(periodRegex, "/");
			set(swagger, oneOfPath, []);
			pathMap[pathRef] = {propName: value, oneOfPath};
		}
	});

	// Find Children
	deep.deepMapValues(swagger, (value, path) => {
		if (pathMap[value] != null && variantTestRegex.test(path)) {
			const objPath = path.replace(allOfRefRegex, "");
			const defPath = "#/" + objPath.replace(periodRegex, "/");
			variantTestRegex.lastIndex = 0;
			const modelName = variantTestRegex.exec(path)[1];
			variantTestRegex.lastIndex = 0;
			// removePaths.push(path.replace(".$ref", ""));
			const schemaExtention: any = {properties: {}};
			schemaExtention.properties[pathMap[value].propName] = {const: modelName};
			set(swagger, path.replace(".$ref", ""), schemaExtention);
			get(swagger, `${pathMap[value].oneOfPath}`).push({$ref: defPath});
		}
	});
	removePaths.forEach((path) => {
		unset(swagger, path);
	});
	return {swagger, discriminators: map(pathMap, "propName")};
}

function objectify(oneOf: any[]): {[x: string]: any} {
	const convertedObj: {[x: string]: any} = {};
	forEach(oneOf, (item, ind) => {
		convertedObj["t" + ind] = item;
	});
	return convertedObj;
}

export function schemaPreprocess(schema: ExtendedSchema):
{schema: ExtendedSchema, resQueue: PriorityQueue<OneOfMarker>} {
	const schemaClone = cloneDeep(schema);
	const oneOfQueue = new PriorityQueue<OneOfMarker>((a, b): boolean => (a.depth > b.depth));

	const deepScan = (scanSchema: ExtendedSchema, depth: number = 0) => {
		if (scanSchema.properties) {
			forEach(scanSchema.properties, (schemaChild) => {deepScan(schemaChild, depth + 1); });
		}

		if (scanSchema.oneOf) {
			if (scanSchema.oneOf.length === 1) {
				scanSchema.allOf = scanSchema.oneOf;
				delete scanSchema.oneOf;
			} else {
				oneOfQueue.push({depth, schema: scanSchema});
			}
			forEach(scanSchema.oneOf, (schemaChild) => {deepScan(schemaChild, depth + 1); });
		}

		if (scanSchema.allOf) {
			forEach(scanSchema.allOf, (schemaChild) => {deepScan(schemaChild, depth + 1); });
		}

		if (scanSchema.additionalProperties) {
			deepScan(scanSchema.additionalProperties, depth + 1);
		}

		if (scanSchema.enum && scanSchema.enum.length === 1) {
			scanSchema.const = scanSchema.enum[0];
			delete scanSchema.enum;
		}

		if (DisallowedFormats.indexOf(scanSchema.format) > -1) {
			CompileLog.warn("removing invalid format:", scanSchema.format);
			delete scanSchema.format;
		}
	};
	const merged = mergeAllOf(schemaClone);

	deepScan(merged);
	return {schema: merged, resQueue: oneOfQueue};
}

export function resolve(resolveQueue: PriorityQueue<OneOfMarker>) {
	while (!resolveQueue.empty()) {
		const item = resolveQueue.top();
		item.schema.oneOf = (objectify(item.schema.oneOf) as any[]);
		resolveQueue.pop();
	}
}

export function mangleKeys(schema: ExtendedSchema): {schema: ExtendedSchema, mangledKeys: MangledKey[]} {
	const mangledKeys: MangledKey[] = [];
	const mangledSchema = mapKeysDeep(schema, (value, key) => {
		if (key === "enum") {
			return "api_enum";
		}
		if (!safeKey.test(key)) {
			const mangled = MANGLED_PREFIX + XXH.h32(key, HASH_SEED).toString();
			mangledKeys.push({original: key, mangled});
			return mangled;
		}
		return key;
	});

	return {schema: mangledSchema, mangledKeys};
}
