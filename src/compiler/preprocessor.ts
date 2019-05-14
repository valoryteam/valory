import {cloneDeep, forEach, get, map, set, unset, isArray} from "lodash";
import {scan} from "rxjs/internal/operators";
import {CompileLog, DisallowedFormats} from "./compiler";
import {DiscriminatorMap, ExtendedSchema, HASH_SEED, MangledKey} from "./compilerheaders";
import {PriorityQueue} from "tstl";
import {Swagger} from "../server/swagger";

const mergeAllOf = require("json-schema-merge-allof");
const mapKeysDeep: <T>(obj: T, callback: (value: any, key: string) => string) => T = require("map-keys-deep-lodash");

const deep: Deep = require("lodash-deep");
const XXH = require("xxhashjs");

const MANGLED_PREFIX = "p";
const periodRegex = /[.]+?/g;
const allOfRefRegex = /.allOf.[\d]+?.\$ref/g;
const variantTestRegex = /definitions.([^.]*).allOf.[\d]+?.\$ref/g;
const getAllOfRefIndexRegex = /allOf.([^.]*).\$ref/g;
const safeKey = /^(?:[A-Za-z_])(?:[0-9a-zA-Z_]*)$/;

interface Deep {
	deepMapValues<T>(obj: T, callback: (value: any, path: string) => any): T;
}

export interface OneOfMarker {
	depth: number;
	schema: ExtendedSchema;
}

export function swaggerPreproccess(swagger: Swagger.Spec): {swagger: Swagger.Spec, discriminators: DiscriminatorMap} {
	const pathMap: {[key: string]: {propName: string, anyOfPath: string}} = {};
	const removePaths: string[] = [];
	const discrimMap: DiscriminatorMap = {};
	// DISCRIMINATOR PROCESSING

	// Find parents
	deep.deepMapValues(swagger, (value, path) => {
		if (path.endsWith(".discriminator")) {
			// console.log(path, "is", value);
			removePaths.push(path);
			const disPath = path.replace(".discriminator", "");
			const anyOfPath = disPath + ".anyOf";
			const pathRef = "#/" + disPath.replace(periodRegex, "/");
			discrimMap[value] = {
				parent: disPath.replace("definitions.", ""),
				children: [],
			};
			set(swagger, anyOfPath, []);
			pathMap[pathRef] = {propName: value, anyOfPath};
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
			discrimMap[pathMap[value].propName].children.push(modelName);
			set(swagger, path.replace(".$ref", ""), {});

			const currentProps = get(swagger, objPath + ".properties") || {};
			set(swagger, objPath + ".properties", Object.assign(schemaExtention.properties, currentProps));

			const currentRequired = get(swagger, objPath + ".required") || [];
			currentRequired.push(pathMap[value].propName);
			set(swagger, objPath + ".required", currentRequired);

			get(swagger, `${pathMap[value].anyOfPath}`).push({$ref: defPath});
		}
	});
	removePaths.forEach((path) => {
		unset(swagger, path);
	});
	return {swagger, discriminators: discrimMap};
}

function objectify(anyOf: any[]): {[x: string]: any} {
	const convertedObj: {[x: string]: any} = {};
	forEach(anyOf, (item, ind) => {
		convertedObj["t" + ind] = item;
	});
	return convertedObj;
}

export function schemaPreprocess(schema: ExtendedSchema):
{schema: ExtendedSchema, resQueue: PriorityQueue<OneOfMarker>} {
	const schemaClone = cloneDeep(schema);
	const anyOfQueue = new PriorityQueue<OneOfMarker>((a, b): boolean => (a.depth > b.depth));

	const deepScan = (scanSchema: ExtendedSchema, depth: number = 0) => {
		if (scanSchema.required) {
			scanSchema.required = scanSchema.required.filter((item) => {
				if (scanSchema.properties[item].readOnly) {
					CompileLog.debug(`Unmarking readonly property "${item}" marked as required`);
					return false;
				}
				return true;
			});
		}

		if (scanSchema.properties) {
			forEach(scanSchema.properties, (schemaChild) => {
				deepScan(schemaChild, depth + 1);
			});
		}

		if (scanSchema.anyOf) {
			// if (scanSchema.anyOf.length === 1) {
			// 	scanSchema.allOf = scanSchema.anyOf;
			// 	delete scanSchema.anyOf;
			// } else {
			// 	anyOfQueue.push({depth, schema: scanSchema});
			// }
			anyOfQueue.push({depth, schema: scanSchema});
			forEach(scanSchema.anyOf, (schemaChild) => {deepScan(schemaChild, depth + 1); });
		}

		if (scanSchema.allOf) {
			forEach(scanSchema.allOf, (schemaChild) => {deepScan(schemaChild, depth + 1); });
		}

		if (scanSchema.items) {
			if (isArray(scanSchema.items)) {
				forEach(scanSchema.items, (schemaChild) => {deepScan(schemaChild, depth + 1); });
			} else {
				deepScan(scanSchema.items as any, depth + 1);
			}
		}

		if (scanSchema.additionalProperties) {
			deepScan(scanSchema.additionalProperties as any, depth + 1);
		}

		if (scanSchema.readOnly) {
			// Wipeout all existing data, property is not allowed anyways
			for (const key in scanSchema) {
				delete (scanSchema as any)[key];
			}
			(scanSchema as any).not = {};
		}

		if (scanSchema.enum && scanSchema.enum.length === 1) {
			scanSchema.const = scanSchema.enum[0];
			delete scanSchema.enum;
		}

		if (scanSchema.type as any === "file") {
			CompileLog.debug(`"file" type is implementation specific and therefore cannot be validated`);
			delete scanSchema.type;
		}

		if (DisallowedFormats.indexOf(scanSchema.format) > -1) {
			CompileLog.debug("removing invalid format:", scanSchema.format);
			delete scanSchema.format;
		}
	};
	const merged = mergeAllOf(schemaClone);

	deepScan(merged);
	return {schema: merged, resQueue: anyOfQueue};
}

export function resolve(resolveQueue: PriorityQueue<OneOfMarker>) {
	while (!resolveQueue.empty()) {
		const item = resolveQueue.top();
		item.schema.anyOf = (objectify(item.schema.anyOf) as any[]);
		resolveQueue.pop();
	}
}

export function mangleKeys(schema: ExtendedSchema): {schema: ExtendedSchema, mangledKeys: MangledKey[]} {
	const mangledKeys: MangledKey[] = [];
	const mangledSchema = mapKeysDeep(schema, (value, key) => {
		if (key === "enum" && Array.isArray(value)) {
			return "api_enum";
		}
		// if (!safeKey.test(key) && mangledKeys.filter((item) => item.original === key).length === 0) {
		// 	const mangled = MANGLED_PREFIX + XXH.h32(key, HASH_SEED).toString();
		// 	mangledKeys.push({original: key, mangled});
		// 	return mangled;
		// }
		return key;
	});

	return {schema: mangledSchema, mangledKeys};
}
