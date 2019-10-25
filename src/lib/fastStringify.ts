import {JSONSchema6} from "json-schema";

const addComma = `
  if (addComma) {
    json += ','
  }
  addComma = true
`;

export const preamble = `
    ${$asString.toString()}
    ${$asStringNullable.toString()}
    ${$asStringSmall.toString()}
    ${$asNumber.toString()}
    ${$asNumberNullable.toString()}
    ${$asIntegerNullable.toString()}
    ${$asNull.toString()}
    ${$asBoolean.toString()}
    ${$asBooleanNullable.toString()}
    var $asInteger = $asNumber
`;

export function build(schema: JSONSchema6): { code: string, funcName: string } {
	/* eslint no-new-func: "off" */
	let code = "";

	if (schema.type === undefined) {
		schema.type = inferTypeByKeyword(schema);
	}

	let main;

	switch (schema.type) {
		case "object":
			main = "$main";
			code = buildObject(schema, code, main, null, schema);
			break;
		case "string":
			main = $asString.name;
			break;
		case "integer":
			main = $asInteger.name;
			break;
		case "number":
			main = $asNumber.name;
			break;
		case "boolean":
			main = $asBoolean.name;
			break;
		case "null":
			main = $asNull.name;
			break;
		case "array":
			main = "$main";
			code = buildArray(schema, code, main, null, schema);
			break;
		case undefined:
			main = "JSON.stringify";
			break;
		default:
			throw new Error(`${schema.type} unsupported`);
	}

	return {code, funcName: main};
}

const objectKeywords = [
	"maxProperties",
	"minProperties",
	"required",
	"properties",
	"patternProperties",
	"additionalProperties",
	"dependencies",
];

const arrayKeywords = [
	"items",
	"additionalItems",
	"maxItems",
	"minItems",
	"uniqueItems",
	"contains",
];

const stringKeywords = [
	"maxLength",
	"minLength",
	"pattern",
];

const numberKeywords = [
	"multipleOf",
	"maximum",
	"exclusiveMaximum",
	"minimum",
	"exclusiveMinimum",
];

/**
 * Infer type based on keyword in order to generate optimized code
 * https://json-schema.org/latest/json-schema-validation.html#rfc.section.6
 */
function inferTypeByKeyword(schema: JSONSchema6) {
	for (const keyword of objectKeywords) {
		if (keyword in schema) {
			return "object";
		}
	}
	for (const keyword of arrayKeywords) {
		if (keyword in schema) {
			return "array";
		}
	}
	for (const keyword of stringKeywords) {
		if (keyword in schema) {
			return "string";
		}
	}
	for (const keyword of numberKeywords) {
		if (keyword in schema) {
			return "number";
		}
	}
	return schema.type;
}

function $asNull() {
	return "null";
}

function $asInteger(i: any) {
	return $asNumber(i);
}

function $asIntegerNullable(i?: any) {
	return i === null ? null : $asInteger(i);
}

function $asNumber(i: any) {
	const num = Number(i);
	if (isNaN(num)) {
		return "null";
	} else {
		return "" + num;
	}
}

function $asNumberNullable(i?: any) {
	return i === null ? null : $asNumber(i);
}

function $asBoolean(bool: any) {
	return bool && "true" || "false"; // eslint-disable-line
}

function $asBooleanNullable(bool?: any) {
	return bool === null ? null : $asBoolean(bool);
}

function $asString(str: any) {
	if (str instanceof Date) {
		return '"' + str.toISOString() + '"';
	} else if (str === null) {
		return '""';
	} else if (str instanceof RegExp) {
		str = str.source;
	} else if (typeof str !== "string") {
		str = str.toString();
	}

	if (str.length < 42) {
		return $asStringSmall(str);
	} else {
		return JSON.stringify(str);
	}
}

function $asStringNullable(str?: any) {
	return str === null ? null : $asString(str);
}

// magically escape strings for json
// relying on their charCodeAt
// everything below 32 needs JSON.stringify()
// every string that contain surrogate needs JSON.stringify()
// 34 and 92 happens all the time, so we
// have a fast case for them
function $asStringSmall(str: string) {
	let result = "";
	let last = 0;
	let found = false;
	let surrogateFound = false;
	const l = str.length;
	let point = 255;
	for (let i = 0; i < l && point >= 32; i++) {
		point = str.charCodeAt(i);
		if (point >= 0xD800 && point <= 0xDFFF) {
			// The current character is a surrogate.
			surrogateFound = true;
		}
		if (point === 34 || point === 92) {
			result += str.slice(last, i) + "\\";
			last = i;
			found = true;
		}
	}

	if (!found) {
		result = str;
	} else {
		result += str.slice(last);
	}
	return ((point < 32) || (surrogateFound === true)) ? JSON.stringify(str) : '"' + result + '"';
}

function addPatternProperties(schema: JSONSchema6, externalSchema: any, fullSchema: JSONSchema6) {
	const pp = schema.patternProperties as any;
	let code = `
      var properties = ${JSON.stringify(schema.properties)} || {}
      var keys = Object.keys(obj)
      for (var i = 0; i < keys.length; i++) {
        if (properties[keys[i]]) continue
  `;
	Object.keys(pp).forEach((regex, index) => {
		const type = pp[regex].type;
		code += `
        if (/${regex.replace(/\\*\//g, "\\/")}/.test(keys[i])) {
    `;
		if (type === "object") {
			code += buildObject(pp[regex], "", "buildObjectPP" + index, externalSchema, fullSchema);
			code += `
          ${addComma}
          json += $asString(keys[i]) + ':' + buildObjectPP${index}(obj[keys[i]])
      `;
		} else if (type === "array") {
			code += buildArray(pp[regex], "", "buildArrayPP" + index, externalSchema, fullSchema);
			code += `
          ${addComma}
          json += $asString(keys[i]) + ':' + buildArrayPP${index}(obj[keys[i]])
      `;
		} else if (type === "null") {
			code += `
          ${addComma}
          json += $asString(keys[i]) +':null'
      `;
		} else if (type === "string") {
			code += `
          ${addComma}
          json += $asString(keys[i]) + ':' + $asString(obj[keys[i]])
      `;
		} else if (type === "integer") {
			code += `
          ${addComma}
          json += $asString(keys[i]) + ':' + $asInteger(obj[keys[i]])
      `;
		} else if (type === "number") {
			code += `
          ${addComma}
          json += $asString(keys[i]) + ':' + $asNumber(obj[keys[i]])
      `;
		} else if (type === "boolean") {
			code += `
          ${addComma}
          json += $asString(keys[i]) + ':' + $asBoolean(obj[keys[i]])
      `;
		} else {
			code += `
        throw new Error('Cannot coerce ' + obj[keys[i]] + ' to ${type}')
      `;
		}

		code += `
          continue
        }
    `;
	});
	if (schema.additionalProperties) {
		code += additionalProperty(schema, externalSchema, fullSchema);
	}

	code += `
      }
  `;
	return code;
}

function additionalProperty(schema: JSONSchema6, externalSchema: JSONSchema6 | null, fullSchema: JSONSchema6) {
	const ap = schema.additionalProperties as any;
	let code = "";
	if (ap === true) {
		return `
        if (obj[keys[i]] !== undefined) {
          ${addComma}
          json += $asString(keys[i]) + ':' + JSON.stringify(obj[keys[i]])
        }
    `;
	}

	const type = ap.type;
	if (type === "object") {
		code += buildObject(ap, "", "buildObjectAP", externalSchema);
		code += `
        ${addComma}
        json += $asString(keys[i]) + ':' + buildObjectAP(obj[keys[i]])
    `;
	} else if (type === "array") {
		code += buildArray(ap, "", "buildArrayAP", externalSchema, fullSchema);
		code += `
        ${addComma}
        json += $asString(keys[i]) + ':' + buildArrayAP(obj[keys[i]])
    `;
	} else if (type === "null") {
		code += `
        ${addComma}
        json += $asString(keys[i]) +':null'
    `;
	} else if (type === "string") {
		code += `
        ${addComma}
        json += $asString(keys[i]) + ':' + $asString(obj[keys[i]])
    `;
	} else if (type === "integer") {
		code += `
        var t = Number(obj[keys[i]])
    `;
		code += `
          if (!isNaN(t)) {
            ${addComma}
            json += $asString(keys[i]) + ':' + t
          }
      `;
	} else if (type === "number") {
		code += `
        var t = Number(obj[keys[i]])
        if (!isNaN(t)) {
          ${addComma}
          json += $asString(keys[i]) + ':' + t
        }
    `;
	} else if (type === "boolean") {
		code += `
        ${addComma}
        json += $asString(keys[i]) + ':' + $asBoolean(obj[keys[i]])
    `;
	} else {
		code += `
        throw new Error('Cannot coerce ' + obj[keys[i]] + ' to ${type}')
    `;
	}
	return code;
}

function addAdditionalProperties(schema: JSONSchema6, externalSchema?: JSONSchema6, fullSchema?: JSONSchema6) {
	return `
      var properties = ${JSON.stringify(schema.properties)} || {}
      var keys = Object.keys(obj)
      for (var i = 0; i < keys.length; i++) {
        if (properties[keys[i]]) continue
        ${additionalProperty(schema, externalSchema, fullSchema)}
      }
  `;
}

// function idFinder(schema: JSONSchema6, searchedId: string) {
//     let objSchema: JSONSchema6 | null = null;
//     // tslint:disable-next-line:no-shadowed-variable
//     const explore = (schema?: JSONSchema6, searchedId?: string) => {
//         Object.keys(schema || {}).forEach((key, i, a) => {
//             if (key === "$id" && schema[key] === searchedId) {
//                 objSchema = schema;
//             } else if (objSchema === undefined && typeof (schema as any)[key] === "object") {
//                 explore((schema as any)[key], searchedId);
//             }
//         });
//     };
//     explore(schema, searchedId);
//     return objSchema;
// }

function sanitizeKey(key: string) {
	return key.replace(/(\\*)'/g, function(match, p1) {
		let base: string;
		if (p1.length % 2 === 1) {
			base = p1.slice(2);
		} else {
			base = p1;
		}
		return base + "\\'";
	});
}

function buildCode(schema: JSONSchema6, code: string, laterCode: string, name: string, externalSchema?: JSONSchema6, fullSchema?: JSONSchema6) {
	Object.keys(schema.properties || {}).forEach((key) => {
		// Using obj['key'] !== undefined instead of obj.hasOwnProperty(prop) for perf reasons,
		// see https://github.com/mcollina/fast-json-stringify/pull/3 for discussion.

		const type = (schema.properties[key] as any).type;
		const nullable = (schema.properties[key] as any).nullable;
		const sanitized = sanitizeKey(key);
		const asString = sanitizeKey($asString(key).replace(/\\/g, "\\\\"));

		if (nullable) {
			code += `
        if (obj['${sanitized}'] === null) {
          ${addComma}
          json += '${asString}:null'
          var rendered = true
        } else {
      `;
		}

		if (type === "number") {
			code += `
          var t = Number(obj['${sanitized}'])
          if (!isNaN(t)) {
            ${addComma}
            json += '${asString}:' + t
      `;
		} else if (type === "integer") {
			code += `
          var rendered = false
      `;
			code += `
            var t = Number(obj['${sanitized}'])
            if (!isNaN(t)) {
              ${addComma}
              json += '${asString}:' + t
              rendered = true
            }
        `;
			code += `
          if (rendered) {
      `;
		} else {
			code += `
        if (obj['${sanitized}'] !== undefined) {
          ${addComma}
          json += '${asString}:'
        `;

			const result = nested(laterCode, name, key, schema.properties[key] as any, externalSchema, fullSchema);
			code += result.code;
			laterCode = result.laterCode;
		}

		const defaultValue = (schema.properties[key] as any).default;
		if (defaultValue !== undefined) {
			code += `
      } else {
        ${addComma}
        json += '${asString}:${sanitizeKey(JSON.stringify(defaultValue).replace(/\\/g, "\\\\"))}'
      `;
		} else if (schema.required && schema.required.indexOf(key) !== -1) {
			code += `
      } else {
        throw new Error('${sanitized} is required!')
      `;
		}

		code += `
      }
    `;

		if (nullable) {
			code += `
        }
      `;
		}
	});
	return {code, laterCode};
}

function buildCodeWithAllOfs(schema: JSONSchema6, code: string, laterCode: string, name: string, externalSchema?: JSONSchema6, fullSchema?: JSONSchema6) {
	if (schema.allOf) {
		schema.allOf.forEach((ss) => {
			const builtCode = buildCodeWithAllOfs(ss as any, code, laterCode, name, externalSchema, fullSchema);

			code = builtCode.code;
			laterCode = builtCode.laterCode;
		});
	} else {
		const builtCode = buildCode(schema, code, laterCode, name, externalSchema, fullSchema);

		code = builtCode.code;
		laterCode = builtCode.laterCode;
	}

	return {code, laterCode};
}

function buildInnerObject(schema: JSONSchema6, name: string, externalSchema?: JSONSchema6, fullSchema?: JSONSchema6) {
	const laterCode = "";
	let code = "";
	if (schema.patternProperties) {
		code += addPatternProperties(schema, externalSchema, fullSchema);
	} else if (schema.additionalProperties && !schema.patternProperties) {
		code += addAdditionalProperties(schema, externalSchema, fullSchema);
	}

	return buildCodeWithAllOfs(schema, code, laterCode, name, externalSchema, fullSchema);
}

function toJSON(variableName: string) {
	return `typeof ${variableName}.toJSON === 'function'
    ? ${variableName}.toJSON()
    : ${variableName}
  `;
}

function buildObject(schema: JSONSchema6, code: string, name: string, externalSchema?: JSONSchema6, fullSchema?: JSONSchema6) {
	code += `
    function ${name} (input) {
  `;
	if ((schema as any).nullable) {
		code += `
      if(input === null) {
        return '${$asNull()}';
      }
  `;
	}
	code += `
      var obj = ${toJSON("input")}
      var json = '{'
      var addComma = false
  `;

	if (schema.anyOf) {
		code += `
			return JSON.stringify(obj)
		}	
		`;
		return code;
	}

	let laterCode: string;
	let r;
	r = buildInnerObject(schema, name, externalSchema, fullSchema);

	code += r.code;
	laterCode = r.laterCode;

	// Removes the comma if is the last element of the string (in case there are not properties)
	code += `
      json += '}'
      return json
    }
  `;

	code += laterCode;
	return code;
}

function buildArray(schema: JSONSchema6, code: string, name: string, externalSchema?: JSONSchema6, fullSchema?: JSONSchema6) {
	code += `
    function ${name} (obj) {
  `;
	if ((schema as any).nullable) {
		code += `
      if(obj === null) {
        return '${$asNull()}';
      }
    `;
	}
	code += `
      var json = '['
  `;
	let laterCode = "";

	let result = {code: "", laterCode: ""};
	if (Array.isArray(schema.items)) {
		result = schema.items.reduce((res, item, i) => {
			const accessor = "[i]";
			const tmpRes = nested(laterCode, name, accessor, item as any, externalSchema, fullSchema, i);
			const condition = `i === ${i} && ${buildArrayTypeCondition((item as any).type, accessor)}`;
			return {
				code: `${res.code}
        ${i > 0 ? "else" : ""} if (${condition}) {
          ${tmpRes.code}
        }`,
				laterCode: `${res.laterCode}
        ${tmpRes.laterCode}`,
			};
		}, result);
		result.code += `
    else {
      throw new Error(\`Item at $\{i} does not match schema definition.\`)
    }
    `;
	} else {
		result = nested(laterCode, name, "[i]", schema.items as any, externalSchema, fullSchema);
	}

	code += `
    var l = obj.length
    var w = l - 1
    for (var i = 0; i < l; i++) {
      if (i > 0) {
        json += ','
      }
      ${result.code}
    }
  `;

	laterCode = result.laterCode;

	code += `
      json += ']'
      return json
    }
  `;

	code += laterCode;

	return code;
}

function buildArrayTypeCondition(type: string | string[], accessor: string): string {
	let condition;
	switch (type) {
		case "null":
			condition = `obj${accessor} === null`;
			break;
		case "string":
			condition = `typeof obj${accessor} === 'string'`;
			break;
		case "integer":
			condition = `Number.isInteger(obj${accessor})`;
			break;
		case "number":
			condition = `Number.isFinite(obj${accessor})`;
			break;
		case "boolean":
			condition = `typeof obj${accessor} === 'boolean'`;
			break;
		case "object":
			condition = `obj${accessor} && typeof obj${accessor} === 'object' && obj${accessor}.constructor === Object`;
			break;
		case "array":
			condition = `Array.isArray(obj${accessor})`;
			break;
		default:
			if (Array.isArray(type)) {
				const conditions = type.map((subType) => {
					return buildArrayTypeCondition(subType, accessor);
				});
				condition = `(${conditions.join(" || ")})`;
			} else {
				throw new Error(`${type} unsupported`);
			}
	}
	return condition;
}

function nested(laterCode: string, name: string, key: string, schema: JSONSchema6, externalSchema?: JSONSchema6, fullSchema?: JSONSchema6, subKey?: string | number) {
	let code = "";
	let funcName;

	subKey = subKey || "";

	if (schema.type === undefined) {
		const inferedType = inferTypeByKeyword(schema);
		if (inferedType) {
			schema.type = inferedType;
		}
	}

	const type = schema.type;
	const nullable = (schema as any).nullable === true;

	const accessor = key.indexOf("[") === 0 ? sanitizeKey(key) : `['${sanitizeKey(key)}']`;
	switch (type) {
		case "null":
			code += `
        json += $asNull()
      `;
			break;
		case "string":
			code += nullable ? `json += obj${accessor} === null ? null : $asString(obj${accessor})` : `json += $asString(obj${accessor})`;
			break;
		case "integer":
			code += nullable ? `json += obj${accessor} === null ? null : $asInteger(obj${accessor})` : `json += $asInteger(obj${accessor})`;
			break;
		case "number":
			code += nullable ? `json += obj${accessor} === null ? null : $asNumber(obj${accessor})` : `json += $asNumber(obj${accessor})`;
			break;
		case "boolean":
			code += nullable ? `json += obj${accessor} === null ? null : $asBoolean(obj${accessor})` : `json += $asBoolean(obj${accessor})`;
			break;
		case "object":
			funcName = (name + key + subKey).replace(/[-.\[\] ]/g, ""); // eslint-disable-line
			laterCode = buildObject(schema, laterCode, funcName, externalSchema, fullSchema);
			code += `
        json += ${funcName}(obj${accessor})
      `;
			break;
		case "array":
			funcName = "$arr" + (name + key + subKey).replace(/[-.\[\] ]/g, ""); // eslint-disable-line
			laterCode = buildArray(schema, laterCode, funcName, externalSchema, fullSchema);
			code += `
        json += ${funcName}(obj${accessor})
      `;
			break;
        case undefined:
		    // TODO: Fix bailout on anyOf
			if ("anyOf" in schema) {
                code += `
          json += JSON.stringify(obj${accessor})
        `;
		// 		schema.anyOf.forEach((s, index) => {
		// 			const nestedResult = nested(laterCode, name, key, s as any, externalSchema, fullSchema, subKey !== "" ? subKey : "i" + index);
		// 			code += `
        //     ${index === 0 ? "if" : "else if"}(ajv.validate(${require("util").inspect(s, {depth: null})}, obj${accessor}))
        //       ${nestedResult.code}
        //   `;
		// 			laterCode = nestedResult.laterCode;
		// 		});
		// 		code += `
        //   else json+= null
        // `;
			} else if (isEmpty(schema)) {
				code += `
          json += JSON.stringify(obj${accessor})
        `;
			} else {
				throw new Error(`${schema.type} unsupported`);
			}
			break;
		default:
			if (Array.isArray(type)) {
				const nullIndex = type.indexOf("null");
				const sortedTypes = nullIndex !== -1 ? [type[nullIndex]].concat(type.slice(0, nullIndex)).concat(type.slice(nullIndex + 1)) : type;
				// tslint:disable-next-line:no-shadowed-variable
				sortedTypes.forEach((type, index) => {
					const tempSchema = Object.assign({}, schema, {type});
					const nestedResult = nested(laterCode, name, key, tempSchema, externalSchema, fullSchema, subKey);
					if (type === "string") {
						code += `
              ${index === 0 ? "if" : "else if"}(typeof obj${accessor} === "${type}" || obj${accessor} instanceof Date || obj${accessor} instanceof RegExp)
                ${nestedResult.code}
            `;
					} else if (type === "null") {
						code += `
              ${index === 0 ? "if" : "else if"}(obj${accessor} == null)
              ${nestedResult.code}
            `;
					} else if (type === "array") {
						code += `
              ${index === 0 ? "if" : "else if"}(Array.isArray(obj${accessor}))
              ${nestedResult.code}
            `;
					} else if (type === "integer") {
						code += `
              ${index === 0 ? "if" : "else if"}(Number.isInteger(obj${accessor}) || obj${accessor} === null)
              ${nestedResult.code}
            `;
					} else if (type === "number") {
						code += `
              ${index === 0 ? "if" : "else if"}(isNaN(obj${accessor}) === false)
              ${nestedResult.code}
            `;
					} else {
						code += `
              ${index === 0 ? "if" : "else if"}(typeof obj${accessor} === "${type}")
              ${nestedResult.code}
            `;
					}
					laterCode = nestedResult.laterCode;
				});
				code += `
          else json+= null
        `;
			} else {
				throw new Error(`${type} unsupported`);
			}
	}

	return {
		code,
		laterCode,
	};
}

function isEmpty(schema: JSONSchema6) {
	for (const key in schema) {
		if (schema.hasOwnProperty(key)) {
			return false;
		}
	}
	return true;
}
