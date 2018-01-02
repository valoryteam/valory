"use strict";
exports.__esModule = true;
var lodash_1 = require("lodash");
var metrohash_1 = require("metrohash");
var stringify = require("fast-json-stable-stringify");
var Hasher = new metrohash_1.MetroHash64();
function compileMethodSchema(operation, method, pathName, requestObjectMap) {
    var schema = {
        properties: {},
        required: [],
        type: "object"
    };
    var addProperty = function (param) {
        var requestField = requestObjectMap[param["in"]];
        var requestFieldObj = schema.properties[requestField];
        var prop = {};
        if (!requestFieldObj) {
            requestFieldObj = schema.properties[requestField] = {
                properties: {},
                required: undefined,
                type: "object"
            };
        }
        requestFieldObj.properties[param.name] = prop;
        for (var _i = 0, _a = Object.keys(param); _i < _a.length; _i++) {
            var key = _a[_i];
            switch (key) {
                case "description":
                case "in":
                case "name":
                case "required":
                    break;
                default:
                    prop[key] = param[key];
            }
        }
        if (param.required) {
            if (requestFieldObj.required == null) {
                requestFieldObj.required = [];
            }
            if (requestFieldObj.required.indexOf(param.name)) {
                requestFieldObj.required.push(param.name);
            }
            if (schema.required == null) {
                schema.required = [];
            }
            if (schema.required.indexOf(requestField) < 0) {
                schema.required.push(requestField);
            }
        }
    };
    lodash_1.each(operation.parameters, function (parameter) {
        switch (parameter["in"]) {
            case "body":
                schema.properties.body = parameter.schema;
                if (!schema.required) {
                    schema.required = [];
                }
                schema.required.push("body");
                break;
            case "header":
                parameter.name = parameter.name.toLowerCase();
            case "formData":
            case "query":
            case "path":
                addProperty(parameter);
        }
    });
    return schema;
}
exports.compileMethodSchema = compileMethodSchema;
// function deepScan(schema: ExtendedSchema) {
// 	if (schema.properties) {
// 		forEach(schema.properties, deepScan);
// 	}
//
// 	if (schema.allOf) {
// 		allOfResolveQueue.push(schema);
// 		forEach(schema.allOf, deepScan);
// 	}
// 	if (schema.additionalProperties) {
// 		forEach(schema.additionalProperties, deepScan);
// 	}
// 	if (schema.enum != null) {
// 		if (schema.enum.length === 1) {
// 			schema.const = schema.enum[0];
// 			delete schema.enum;
// 		}
// 	}
// 	if (DisallowedFormats.indexOf(schema.format) > -1) {
// 		console.warn("Removing disallowed swagger type", schema.format, "from endpoint", pathName);
// 		delete schema.format;
// 	}
// }
