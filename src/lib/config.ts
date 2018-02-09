import * as fs from "fs";

const SEP_CHAR = process.env["CONFIG_SEPCHAR"] || "_";

export function loadConfig<T>(referencePath: string): T {
	const retObj = JSON.parse(fs.readFileSync(referencePath).toString("utf8"));
	return deepMap(retObj, "", (value, key, rootKey) => {
		const envVar = (rootKey !== "") ? process.env[`${rootKey}${SEP_CHAR}${key}`] : process.env[key];
		if (envVar == null) {
			return value;
		}
		try {
			switch (typeof value) {
				case "boolean":
					return (envVar === "true" || envVar === "True");
				case "number":
					return parseFloat(envVar);
				default:
					return envVar;
			}
		} catch (err) {
			throw new Error(`Could not parse value for config property: ${rootKey}.${key}`);
		}
	});
}

function deepMap<T extends {[x: string]: any}>(
	obj: T, rootKey: string, cb: (value: any, key: string, rootKey: string) => any): T {
	Object.keys(obj).forEach((k) => {
		let val;

		if (obj[k] !== null && typeof obj[k] === "object") {
			const newRoot = (rootKey !== "") ? `${rootKey}.${k}` : k;
			val = deepMap(obj[k], newRoot, cb);
		} else {
			val = cb(obj[k], k, rootKey);
		}

		obj[k] = val;
	});

	return obj;
}
