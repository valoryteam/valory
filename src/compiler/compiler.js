"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var lodash_1 = require("lodash");
var swagger_parser_1 = require("swagger-parser");
var preprocessor_1 = require("./preprocessor");
var method_1 = require("./method");
var metrohash_1 = require("metrohash");
var Ajv = require("ajv");
var stringify = require("fast-json-stable-stringify");
exports.DisallowedFormats = ["float", "double", "int32", "int64", "byte", "binary"];
exports.FUNCTION_PREFIX = "f";
var Hasher = new metrohash_1.MetroHash64();
var ajv = new Ajv({
    coerceTypes: true,
    useDefaults: "shared",
    sourceCode: true,
    errorDataPath: "property",
    unicode: false,
    $data: true
});
require("ajv-keywords")(ajv, "select");
function compile(spec, options) {
    if (options === void 0) { options = { requestFieldMapping: {
            body: "body",
            formData: "post",
            header: "normalizedHeaders",
            path: "pathParams",
            query: "queryString"
        } }; }
    return __awaiter(this, void 0, void 0, function () {
        var preSwag, derefSwag, apiHashes, apiCache, apiSchemas, _i, _a, path, _b, _c, method, hash, schema, schemaProcessed;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, swagger_parser_1.validate(lodash_1.cloneDeep(spec))];
                case 1:
                    _d.sent();
                    preSwag = preprocessor_1.swaggerPreproccess(spec);
                    return [4 /*yield*/, swagger_parser_1.dereference(spec)];
                case 2:
                    derefSwag = _d.sent();
                    apiHashes = [];
                    apiCache = [];
                    apiSchemas = [];
                    for (_i = 0, _a = Object.keys(derefSwag.paths); _i < _a.length; _i++) {
                        path = _a[_i];
                        for (_b = 0, _c = Object.keys(derefSwag.paths[path]); _b < _c.length; _b++) {
                            method = _c[_b];
                            hash = exports.FUNCTION_PREFIX + Hasher.update(stringify(spec.paths[path])).digest();
                            schema = method_1.compileMethodSchema(derefSwag.paths[path][method], method, path, options.requestFieldMapping);
                            schemaProcessed = preprocessor_1.schemaPreprocess(schema);
                            apiHashes.push(hash);
                            apiSchemas.push(schema);
                            console.log(JSON.stringify(schemaProcessed, null, 2));
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.compile = compile;
