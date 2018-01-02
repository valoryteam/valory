"use strict";
exports.__esModule = true;
var lodash_1 = require("lodash");
var compiler_1 = require("./compiler");
var PriorityQueue_1 = require("ts-priority-queue/src/PriorityQueue");
var deep = require("lodash-deep");
var periodRegex = /[.]+?/g;
var allOfRefRegex = /.allOf.[\d]+?.\$ref/g;
var variantTestRegex = /definitions.([^.]*).allOf.[\d]+?.\$ref/g;
var getAllOfRefIndexRegex = /allOf.([^.]*).\$ref/g;
function swaggerPreproccess(swagger) {
    var pathMap = {};
    var removePaths = [];
    // DISCRIMINATOR PROCESSING
    // Find parents
    deep.deepMapValues(swagger, function (value, path) {
        if (path.indexOf("discriminator") > -1) {
            console.log(path, "is", value);
            removePaths.push(path);
            var disPath = path.replace(".discriminator", "");
            var oneOfPath = disPath + ".oneOf";
            var pathRef = "#/" + disPath.replace(periodRegex, "/");
            lodash_1.set(swagger, oneOfPath, []);
            pathMap[pathRef] = { propName: value, oneOfPath: oneOfPath };
        }
    });
    // Find Children
    deep.deepMapValues(swagger, function (value, path) {
        if (pathMap[value] != null && variantTestRegex.test(path)) {
            var objPath = path.replace(allOfRefRegex, "");
            var defPath = "#/" + objPath.replace(periodRegex, "/");
            variantTestRegex.lastIndex = 0;
            var modelName = variantTestRegex.exec(path)[1];
            variantTestRegex.lastIndex = 0;
            // removePaths.push(path.replace(".$ref", ""));
            var schemaExtention = { properties: {} };
            schemaExtention.properties[pathMap[value].propName] = { "const": modelName };
            lodash_1.set(swagger, path.replace(".$ref", ""), schemaExtention);
            lodash_1.get(swagger, "" + pathMap[value].oneOfPath).push({ $ref: defPath });
        }
    });
    removePaths.forEach(function (path) {
        lodash_1.unset(swagger, path);
    });
    return swagger;
}
exports.swaggerPreproccess = swaggerPreproccess;
function schemaPreprocess(schema) {
    var schemaClone = lodash_1.cloneDeep(schema);
    var allOfResQueue = new PriorityQueue_1["default"]({
        comparator: function (a, b) { return (a.depth > b.depth) ? 1 : 0; }
    });
    var deepScan = function (scanSchema, depth) {
        if (depth === void 0) { depth = 0; }
        if (scanSchema.properties) {
            lodash_1.forEach(scanSchema.properties, function (schemaChild) { deepScan(schemaChild, depth + 1); });
        }
        if (scanSchema.allOf) {
            console.log("All of found, depth:", depth, "content:", JSON.stringify(scanSchema, null, 2));
            allOfResQueue.queue({ depth: depth, schema: scanSchema });
            lodash_1.forEach(scanSchema.allOf, function (schemaChild) { deepScan(schemaChild, depth + 1); });
        }
        if (scanSchema.additionalProperties) {
            deepScan(scanSchema.additionalProperties, depth + 1);
        }
        if (scanSchema["enum"] && scanSchema["enum"].length === 1) {
            scanSchema["const"] = scanSchema["enum"][0];
            delete scanSchema["enum"];
        }
        if (compiler_1.DisallowedFormats.indexOf(scanSchema.format) > -1) {
            console.log("removing invalid format:", scanSchema.format);
            delete scanSchema.format;
        }
    };
    deepScan(schemaClone);
    return schemaClone;
}
exports.schemaPreprocess = schemaPreprocess;
