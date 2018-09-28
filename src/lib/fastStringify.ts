// tslint:disable:max-line-length

import {JSONSchema6} from "json-schema";

const addComma = `
  if (addComma) {
    json += ','
  }
  addComma = true
`;

const isLong: any = null;
let codeCache: string[] = [];
export const preamble = `
    ${$asString.toString()}
    ${$asStringSmall.toString()}
    ${$asNumber.toString()}
    ${$asNull.toString()}
    ${$asBoolean.toString()}
    var $asInteger = $asNumber
  `;

export function build(schema: JSONSchema6, sources: boolean = false): ((obj: any) => string) | string[] {
    let code = `
    'use strict'
    ${preamble}
  `;

    codeCache = [];
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
            main = $asNumber.name;
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
        default:
            throw new Error(`${schema.type} unsupported`);
    }

    code += `
    ;
    return ${main}
  `;

    if (sources) {
        return codeCache;
    } else {
        return (Function.apply(null, [code]).apply(null, []));
    }
}

function $asNull() {
    return "null";
}

function $asNumber(i: any) {
    const num = Number(i);
    if (isNaN(num)) {
        return "null";
    } else {
        return "" + num;
    }
}

function $asBoolean(bool: any) {
    return bool && "true" || "false"; // eslint-disable-line
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

// magically escape strings for json
// relying on their charCodeAt
// everything below 32 needs JSON.stringify()
// 34 and 92 happens all the time, so we
// have a fast case for them
function $asStringSmall(str: any) {
    let result = "";
    let last = 0;
    let found = false;
    const l = str.length;
    let point = 255;
    for (let i = 0; i < l && point >= 32; i++) {
        point = str.charCodeAt(i);
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
    return point < 32 ? JSON.stringify(str) : '"' + result + '"';
}

function addPatternProperties(schema: any, externalSchema: any, fullSchema: any) {
    const pp: any = schema.patternProperties;
    let code = `
      var properties = ${JSON.stringify(schema.properties)} || {}
      var keys = Object.keys(obj)
      for (var i = 0; i < keys.length; i++) {
        if (properties[keys[i]]) continue
  `;
    Object.keys(pp).forEach((regex, index) => {
        if (pp[regex]["$ref"]) {
            pp[regex] = refFinder(pp[regex]["$ref"], fullSchema, externalSchema);
        }
        const type = pp[regex].type;
        code += `
        if (/${regex}/.test(keys[i])) {
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

function additionalProperty(schema: any, externalSchema: any, fullSchema: any) {
    let ap = schema.additionalProperties as any;
    let code = "";
    if (ap === true) {
        return `
        if (obj[keys[i]] !== undefined) {
          ${addComma}
          json += $asString(keys[i]) + ':' + JSON.stringify(obj[keys[i]])
        }
    `;
    }
    if (ap["$ref"]) {
        ap = refFinder(ap["$ref"], fullSchema, externalSchema);
    }

    const type = ap.type;
    if (type === "object") {
        code += buildObject(ap, "", "buildObjectAP", externalSchema, null);
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
        if (isLong) {
            code += `
          if (isLong(obj[keys[i]]) || !isNaN(t)) {
            ${addComma}
            json += $asString(keys[i]) + ':' + $asInteger(obj[keys[i]])
          }
      `;
        } else {
            code += `
          if (!isNaN(t)) {
            ${addComma}
            json += $asString(keys[i]) + ':' + t
          }
      `;
        }
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

function addAdditionalProperties(schema: any, externalSchema: any, fullSchema: any) {
    return `
      var properties = ${JSON.stringify(schema.properties)} || {}
      var keys = Object.keys(obj)
      for (var i = 0; i < keys.length; i++) {
        if (properties[keys[i]]) continue
        ${additionalProperty(schema, externalSchema, fullSchema)}
      }
  `;
}

function refFinder(ref: any, schema: any, externalSchema: any) {
    // Split file from walk
    ref = ref.split("#");
    // If external file
    if (ref[0]) {
        schema = externalSchema[ref[0]];
    }
    let code = "return schema";
    // If it has a path
    if (ref[1]) {
        const walk = ref[1].split("/");
        for (let i = 1; i < walk.length; i++) {
            code += `['${walk[i]}']`;
        }
    }
    return (new Function("schema", code))(schema);
}

function buildCode(schema: any, code: string, laterCode: string, name: string, externalSchema: any, fullSchema: any) {
    Object.keys(schema.properties || {}).forEach((key, i, a) => {
        if (schema.properties[key]["$ref"]) {
            schema.properties[key] = refFinder(schema.properties[key]["$ref"], fullSchema, externalSchema);
        }

        // Using obj['key'] !== undefined instead of obj.hasOwnProperty(prop) for perf reasons,
        // see https://github.com/mcollina/fast-json-stringify/pull/3 for discussion.

        const type = schema.properties[key].type;
        if (type === "number") {
            code += `
          var t = Number(obj['${key}'])
          if (!isNaN(t)) {
            ${addComma}
            json += '${$asString(key)}:' + t
      `;
        } else if (type === "integer") {
            code += `
          var rendered = false
      `;
            if (isLong) {
                code += `
            if (isLong(obj['${key}'])) {
              ${addComma}
              json += '${$asString(key)}:' + obj['${key}'].toString()
              rendered = true
            } else {
              var t = Number(obj['${key}'])
              if (!isNaN(t)) {
                ${addComma}
                json += '${$asString(key)}:' + t
                rendered = true
              }
            }
        `;
            } else {
                code += `
            var t = Number(obj['${key}'])
            if (!isNaN(t)) {
              ${addComma}
              json += '${$asString(key)}:' + t
              rendered = true
            }
        `;
            }
            code += `
          if (rendered) {
      `;
        } else {
            code += `
        if (obj['${key}'] !== undefined) {
          ${addComma}
          json += '${$asString(key)}:'
        `;

            const result = nested(laterCode, name, key, schema.properties[key], externalSchema, fullSchema, null);
            code += result.code;
            laterCode = result.laterCode;
        }

        const defaultValue = schema.properties[key].default;
        if (defaultValue !== undefined) {
            code += `
      } else {
        ${addComma}
        json += '${$asString(key)}:${JSON.stringify(defaultValue).replace(/'/g, "'")}'
      `;
        } else if (schema.required && schema.required.indexOf(key) !== -1) {
            code += `
      } else {
        throw new Error('${key} is required!')
      `;
        }

        code += `
      }
    `;
    });

    return {code, laterCode};
}

function buildCodeWithAllOfs(schema: any, code: string, laterCode: string,
                             name: string, externalSchema: any, fullSchema: any) {
    if (schema.allOf) {
        schema.allOf.forEach((ss: any) => {
            const builtCode = buildCodeWithAllOfs(ss, code, laterCode, name, externalSchema, fullSchema);

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

function buildInnerObject(schema: any, name: string, externalSchema: any, fullSchema: any) {
    const laterCode = "";
    let code = "";
    if (schema.patternProperties) {
        code += addPatternProperties(schema, externalSchema, fullSchema);
    } else if (schema.additionalProperties && !schema.patternProperties) {
        code += addAdditionalProperties(schema, externalSchema, fullSchema);
    }

    return buildCodeWithAllOfs(schema, code, laterCode, name, externalSchema, fullSchema);
}

function buildObject(schema: any, code: string, name: string, externalSchema: any, fullSchema: any): string {
    let temp = `
    function ${name} (obj) {
      var json = '{'
      var addComma = false
  `;

    let laterCode = "";
    let r;
    r = buildInnerObject(schema, name, externalSchema, fullSchema);

    temp += r.code;
    laterCode = r.laterCode;

    // Removes the comma if is the last element of the string (in case there are not properties)
    temp += `
      json += '}'
      return json
    }
  `;

    code += temp + laterCode;
    codeCache.push(temp);
    return code;
}

function buildArray(schema: any, code: string, name: string, externalSchema: any, fullSchema: any): string {
    let temp = `
    function ${name} (obj) {
      var json = '['
  `;

    let laterCode = "";

    if (schema.items["$ref"]) {
        schema.items = refFinder(schema.items["$ref"], fullSchema, externalSchema);
    }

    let result = {code: "", laterCode: ""};
    if (Array.isArray(schema.items)) {
        result = schema.items.reduce((res: any, item: any, i: number) => {
            const accessor = "[i]";
            const tmpRes = nested(laterCode, name, accessor, item, externalSchema, fullSchema, i);
            const condition = `i === ${i} && ${buildArrayTypeCondition(item.type, accessor)}`;
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
        result = nested(laterCode, name, "[i]", schema.items, externalSchema, fullSchema, null);
    }

    temp += `
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

    temp += `
      json += ']'
      return json
    }
  `;

    code += temp + laterCode;

    codeCache.push(temp);
    return code;
}

function buildArrayTypeCondition(type: any, accessor: any): any {
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

function nested(laterCode: string, name: string, key: string, schema: any,
                externalSchema: any, fullSchema: any, subKey: any) {
    let code = "";
    let funcName;
    const type = schema.type;
    const accessor = key.indexOf("[") === 0 ? key : `['${key}']`;
    switch (type) {
        case "null":
            code += `
        json += $asNull()
      `;
            break;
        case "string":
            code += `
        json += $asString(obj${accessor})
      `;
            break;
        case "integer":
            code += `
        json += $asInteger(obj${accessor})
      `;
            break;
        case "number":
            code += `
        json += $asNumber(obj${accessor})
      `;
            break;
        case "boolean":
            code += `
        json += $asBoolean(obj${accessor})
      `;
            break;
        case "object":
            funcName = (name + key + subKey).replace(/[-.\[\] ]/g, ""); // eslint-disable-line
            laterCode = buildObject(schema, laterCode, funcName, externalSchema, fullSchema);
            code += `
        json += ${funcName}(obj${accessor})
      `;
            break;
        case "array":
            funcName = (name + key + subKey).replace(/[-.\[\] ]/g, ""); // eslint-disable-line
            laterCode = buildArray(schema, laterCode, funcName, externalSchema, fullSchema);
            code += `
        json += ${funcName}(obj${accessor})
      `;
            break;
        case undefined:
            if ("anyOf" in schema) {
                schema.anyOf.forEach((s: any, index: any) => {
                    const nestedResult = nested(laterCode, name, key, s, externalSchema, fullSchema, subKey);
                    code += `
            ${index === 0 ? "if" : "else if"}(ajv.validate(${require("util")
                        .inspect(s, {depth: null})}, obj${accessor}))
              ${nestedResult.code}
          `;
                    laterCode = nestedResult.laterCode;
                });
                code += `
          else json+= null
        `;
            } else if (isEmpty(schema)) {
                code += `
          json += JSON.stringify(obj${accessor})
        `;
            } else {
                throw new Error(`${schema} unsupported`);
            }
            break;
        default:
            if (Array.isArray(type)) {
                const nullIndex = type.indexOf("null");
                const sortedTypes = nullIndex !== -1 ? [type[nullIndex]]
                    .concat(type.slice(0, nullIndex)).concat(type.slice(nullIndex + 1)) : type;
                // tslint:disable-next-line
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

function isEmpty(schema: any) {
    for (const key in schema) {
        if (schema.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}
