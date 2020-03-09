import {ProcessedCompiledSchemaOperation} from "./process-validator";
import {randomBytes} from "crypto";
import {Map, sha1String} from "../../lib/common/util";
import {OpenAPIV3} from "openapi-types";
import {COMPSWAG_VERSION} from "../../lib/config";

const VALIDATOR_MODULE_HEADER = `
// @ts-nocheck
/* tslint:disable */

const HOSTNAME = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*$/i;
const UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

const formats = {
    date: /^\\d\\d\\d\\d-[0-1]\\d-[0-3]\\d$/,
    time: /^(?:[0-2]\\d:[0-5]\\d:[0-5]\\d|23:59:60)(?:\\.\\d+)?(?:z|[+-]\\d\\d:\\d\\d)?$/i,
    'date-time': /^\\d\\d\\d\\d-[0-1]\\d-[0-3]\\d[t\\s](?:[0-2]\\d:[0-5]\\d:[0-5]\\d|23:59:60)(?:\\.\\d+)?(?:z|[+-]\\d\\d:\\d\\d)$/i,
    uri: /^(?:[a-z][a-z0-9+-.]*:)(?:\\/?\\/)?[^\\s]*$/i,
    'uri-reference': /^(?:(?:[a-z][a-z0-9+-.]*:)?\\/?\\/)?(?:[^\\\\\\s#][^\\s#]*)?(?:#[^\\\\\\s]*)?$/i,
    email: /^[a-z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
    hostname: HOSTNAME,
    url: /^(?:(?:http[s\u017F]?|ftp):\\/\\/)(?:(?:[\\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+(?::(?:[\\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?@)?(?:(?!10(?:\\.[0-9]{1,3}){3})(?!127(?:\\.[0-9]{1,3}){3})(?!169\\.254(?:\\.[0-9]{1,3}){2})(?!192\\.168(?:\\.[0-9]{1,3}){2})(?!172\\.(?:1[6-9]|2[0-9]|3[01])(?:\\.[0-9]{1,3}){2})(?:[1-9][0-9]?|1[0-9][0-9]|2[01][0-9]|22[0-3])(?:\\.(?:1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])){2}(?:\\.(?:[1-9][0-9]?|1[0-9][0-9]|2[0-4][0-9]|25[0-4]))|(?:(?:(?:[0-9KSa-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-?)*(?:[0-9KSa-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)(?:\\.(?:(?:[0-9KSa-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-?)*(?:[0-9KSa-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)*(?:\\.(?:(?:[KSa-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]){2,})))(?::[0-9]{2,5})?(?:\\/(?:[\\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?$/i,
    ipv4: /^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/,
    ipv6: /^\\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:)))(?:%.+)?\\s*$/i,
    uuid: UUID,
};

function pushArr(target, other) {
    const len = other.length;
    let i;
    for(i=0;i < len;i++){
        target.push(other[i]);
    }
}

function noopBool() {
    return true;
}

function noop(data) {
    return data;
}

function ucs2length(str) {
    var length = 0, len = str.length, pos = 0, value;
    while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 0xD800 && value <= 0xDBFF && pos < len) {
            value = str.charCodeAt(pos);
            if ((value & 0xFC00) == 0xDC00) pos++;
        }
    }
    return length;
}

function equal(a, b) {
    if (a === b) return true;

    var arrA = Array.isArray(a)
    , arrB = Array.isArray(b)
    , i;

    if (arrA && arrB) {
    if (a.length != b.length) return false;
    for (i = 0; i < a.length; i++)
    if (!equal(a[i], b[i])) return false;
    return true;
    }

    if (arrA != arrB) return false;

    if (a && b && typeof a === 'object' && typeof b === 'object') {
    var keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;

    var dateA = a instanceof Date
    , dateB = b instanceof Date;
    if (dateA && dateB) return a.getTime() == b.getTime();
    if (dateA != dateB) return false;

    var regexpA = a instanceof RegExp
    , regexpB = b instanceof RegExp;
    if (regexpA && regexpB) return a.toString() == b.toString();
    if (regexpA != regexpB) return false;

    for (i = 0; i < keys.length; i++)
    if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = 0; i < keys.length; i++)
    if(!equal(a[keys[i]], b[keys[i]])) return false;

    return true;
    }

    return false;
};
`;

export function generateModule(input: ProcessedCompiledSchemaOperation[], spec: OpenAPIV3.Document): string {
    const withIds = input.map((op) => {
        return {
            ...op,
            schemaInteractions: op.schemaInteractions.map(i => {
                return {
                    ...i,
                    id: simpleId(),
                }
            })
        }
    });
    const functionDeclarations = withIds.flatMap(op => op.schemaInteractions).map(interaction => {
        return `const ${interaction.id} = ${interaction.processedValidatorSource}`;
    });

    const exportStructure = withIds.reduce((accum, value) => {
        const methodObj = accum[value.path] || {};
        const statusObj = value.schemaInteractions.reduce((accumInter, inter) => {
            accumInter[(inter.statusCode || -1).toString()] = inter.id;
            return accumInter;
        }, {} as Map<string>);
        methodObj[value.method] = statusObj;
        accum[value.path] = methodObj;
        return accum;
    }, {} as Map<Map<Map<string>>>);

    const stringSpec = JSON.stringify(spec);
    const specHash = sha1String(stringSpec);

    const finalSource = `
    ${VALIDATOR_MODULE_HEADER}
    ${functionDeclarations.join("\n")}
    module["exports"] = {
        "validators": ${JSON.stringify(exportStructure).replace(/:"(.+?)"/g, ":$1")},
        "spec": ${stringSpec},
        "compswagVersion": ${COMPSWAG_VERSION},
        "specHash": "${specHash}"
    };
    `;

    return finalSource;
}

function simpleId(size: number = 6) {
    return "f" + randomBytes(size).toString("hex")
}
