import {cloneDeep, forEach, get, set, unset} from "lodash";
import {Spec} from "swagger-schema-official";
import {DisallowedFormats} from "./compiler";
import {metrohash64} from "metrohash";
import {ExtendedSchema, MangledKey} from "./compilerheaders";

const mergeAllOf = require("json-schema-merge-allof");
const mapKeysDeep: <T>(obj: T, callback: (value: any, key: string) => string) => T = require("map-keys-deep-lodash");

const deep: Deep = require("lodash-deep");

const MANGLED_PREFIX = "p";
const periodRegex = /[.]+?/g;
const allOfRefRegex = /.allOf.[\d]+?.\$ref/g;
const variantTestRegex = /definitions.([^.]*).allOf.[\d]+?.\$ref/g;
const getAllOfRefIndexRegex = /allOf.([^.]*).\$ref/g;
const safeKey = /^(?:[A-Za-z_$])(?:[0-9a-zA-Z_$]*)$/;

interface Deep {
	deepMapValues<T>(obj: T, callback: (value: any, path: string) => any): T;
}

interface AllOfMarker {
	depth: number;
	schema: ExtendedSchema;
}

export function swaggerPreproccess(swagger: Spec): Spec {
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
	return swagger;
}

export function schemaPreprocess(schema: ExtendedSchema): ExtendedSchema {
	const schemaClone = cloneDeep(schema);

	const deepScan = (scanSchema: ExtendedSchema, depth: number = 0) => {
		if (scanSchema.properties) {
			forEach(scanSchema.properties, (schemaChild) => {deepScan(schemaChild, depth + 1); });
		}

		if (scanSchema.oneOf) {
			if (scanSchema.oneOf.length === 1) {
				scanSchema.allOf = scanSchema.oneOf;
				delete scanSchema.oneOf;
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
			console.log("removing invalid format:", scanSchema.format);
			delete scanSchema.format;
		}
	};
	deepScan(schemaClone);

	return mergeAllOf(schemaClone);
}

export function mangleKeys(schema: ExtendedSchema): {schema: ExtendedSchema, mangledKeys: MangledKey[]} {
	const mangledKeys: MangledKey[] = [];
	const mangledSchema = mapKeysDeep(schema, (value, key) => {
		if (key === "enum") {
			return "api_enum";
		}
		if (!safeKey.test(key)) {
			const mangled = MANGLED_PREFIX + metrohash64(key);
			mangledKeys.push({original: key, mangled});
			return mangled;
		}
		return key;
	});

	return {schema: mangledSchema, mangledKeys};
}
