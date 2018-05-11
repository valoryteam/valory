const hasher = require("xxhashjs")["h32"];
const FUNCTION_PREFIX = "f"
function pushArr(target, other) {
    const len = other.length;
    let i;
    for (i = 0; i < len; i++) {
        target.push(other[i]);
    }
}

function validate(path, method, data) {
    const key = FUNCTION_PREFIX + hasher(`${path}:${method}`, 3141997).toString();
    return module["exports"][key];
}

function ucs2length(str) {
    var length = 0,
        len = str.length,
        pos = 0,
        value;
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
    var arrA = Array.isArray(a),
        arrB = Array.isArray(b),
        i;
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
        var dateA = a instanceof Date,
            dateB = b instanceof Date;
        if (dateA && dateB) return a.getTime() == b.getTime();
        if (dateA != dateB) return false;
        var regexpA = a instanceof RegExp,
            regexpB = b instanceof RegExp;
        if (regexpA && regexpB) return a.toString() == b.toString();
        if (regexpA != regexpB) return false;
        for (i = 0; i < keys.length; i++)
            if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = 0; i < keys.length; i++)
            if (!equal(a[keys[i]], b[keys[i]])) return false;
        return true;
    }
    return false;
};
var f1901113617 = function(data, dataPath, parentData, parentDataProperty, rootData) {
    let validationErrors = []; /**@const*/
    const schema = {
        "properties": {
            "body": {
                "description": "Payload for purchase",
                "type": "object",
                "required": ["method", "amount"],
                "oneOf": {
                    "t0": {
                        "description": "Credit Card Payment",
                        "type": "object",
                        "required": ["credit_card"],
                        "properties": {
                            "method": {
                                "const": "CreditCard"
                            },
                            "credit_card": {
                                "description": "credit card object",
                                "type": "object",
                                "properties": {
                                    "type": {
                                        "description": "Type of CC",
                                        "type": "string"
                                    },
                                    "cardholder_name": {
                                        "description": "Name of the CC holder",
                                        "type": "string"
                                    },
                                    "card_number": {
                                        "description": "CC Number",
                                        "type": "string"
                                    },
                                    "exp_date": {
                                        "description": "Expiration date",
                                        "type": "string"
                                    },
                                    "cvv": {
                                        "description": "CVV",
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "properties": {
                    "merchant_ref": {
                        "description": "Merchant reference code – used by Payeezy system will be reflected in your settlement records and webhook notifications. \nIt is an \"optional\" field",
                        "type": "string"
                    },
                    "transaction_type": {
                        "description": "Type of transaction that merchant would want to process",
                        "type": "string"
                    },
                    "method": {
                        "description": "Type of a payment method",
                        "type": "string"
                    },
                    "amount": {
                        "description": "amount",
                        "type": "string"
                    }
                }
            }
        },
        "required": ["body"],
        "type": "object"
    };
    'use strict';
    var vErrors = null;
    var errors = 0;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
        var errs__0 = errors;
        var valid1 = true;
        var data1 = data["body"];
        if (data1 === undefined) {
            valid1 = false;
            var err = 'ValidationError[required]: request.body is a required property';
            if (vErrors === null) vErrors = [err];
            else vErrors.push(err);
            errors++;
        } else {
            var errs_1 = errors;
            if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
                var errs__1 = errors;
                var valid2 = true;
                var data2 = data1["merchant_ref"];
                if (data2 !== undefined) {
                    var errs_2 = errors;
                    if (typeof data2 !== "string") {
                        var dataType2 = typeof data2;
                        var coerced2 = undefined;
                        if (dataType2 == 'number' || dataType2 == 'boolean') coerced2 = '' + data2;
                        else if (data2 === null) coerced2 = '';
                        if (coerced2 === undefined) {
                            var err = 'ValidationError[type]: request.body.merchant_ref should be string';
                            if (vErrors === null) vErrors = [err];
                            else vErrors.push(err);
                            errors++;
                        } else {
                            data2 = coerced2;
                            data1['merchant_ref'] = coerced2;
                        }
                    }
                    var valid2 = errors === errs_2;
                }
                var data2 = data1["transaction_type"];
                if (data2 !== undefined) {
                    var errs_2 = errors;
                    if (typeof data2 !== "string") {
                        var dataType2 = typeof data2;
                        var coerced2 = undefined;
                        if (dataType2 == 'number' || dataType2 == 'boolean') coerced2 = '' + data2;
                        else if (data2 === null) coerced2 = '';
                        if (coerced2 === undefined) {
                            var err = 'ValidationError[type]: request.body.transaction_type should be string';
                            if (vErrors === null) vErrors = [err];
                            else vErrors.push(err);
                            errors++;
                        } else {
                            data2 = coerced2;
                            data1['transaction_type'] = coerced2;
                        }
                    }
                    var valid2 = errors === errs_2;
                }
                var data2 = data1["method"];
                if (data2 === undefined) {
                    valid2 = false;
                    var err = 'ValidationError[required]: request.body.method is a required property';
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                } else {
                    var errs_2 = errors;
                    if (typeof data2 !== "string") {
                        var dataType2 = typeof data2;
                        var coerced2 = undefined;
                        if (dataType2 == 'number' || dataType2 == 'boolean') coerced2 = '' + data2;
                        else if (data2 === null) coerced2 = '';
                        if (coerced2 === undefined) {
                            var err = 'ValidationError[type]: request.body.method should be string';
                            if (vErrors === null) vErrors = [err];
                            else vErrors.push(err);
                            errors++;
                        } else {
                            data2 = coerced2;
                            data1['method'] = coerced2;
                        }
                    }
                    var valid2 = errors === errs_2;
                }
                var data2 = data1["amount"];
                if (data2 === undefined) {
                    valid2 = false;
                    var err = 'ValidationError[required]: request.body.amount is a required property';
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                } else {
                    var errs_2 = errors;
                    if (typeof data2 !== "string") {
                        var dataType2 = typeof data2;
                        var coerced2 = undefined;
                        if (dataType2 == 'number' || dataType2 == 'boolean') coerced2 = '' + data2;
                        else if (data2 === null) coerced2 = '';
                        if (coerced2 === undefined) {
                            var err = 'ValidationError[type]: request.body.amount should be string';
                            if (vErrors === null) vErrors = [err];
                            else vErrors.push(err);
                            errors++;
                        } else {
                            data2 = coerced2;
                            data1['amount'] = coerced2;
                        }
                    }
                    var valid2 = errors === errs_2;
                }
            } else {
                var err = 'ValidationError[type]: request.body should be object';
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
            }
            var errs__1 = errors,
                prevValid1 = false,
                valid1 = false,
                passingSchemas1 = null;
            var errs_2 = errors;
            if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
                var errs__2 = errors;
                var valid3 = true;
                if (data1["method"] !== undefined) {
                    var errs_3 = errors;
                    var schema3 = schema.properties.body.oneOf.t0.properties.method.const;
                    var valid3 = equal(data1["method"], schema3);
                    if (!valid3) {
                        var err = null;
                        errors++;
                    }
                    var valid3 = errors === errs_3;
                }
                var data2 = data1["credit_card"];
                if (data2 === undefined) {
                    valid3 = false;
                    var err = 'ValidationError[required]: request.body.credit_card is a required property';
                    if (vErrors === null) vErrors = [err];
                    else vErrors.push(err);
                    errors++;
                } else {
                    var errs_3 = errors;
                    if ((data2 && typeof data2 === "object" && !Array.isArray(data2))) {
                        var errs__3 = errors;
                        var valid4 = true;
                        var data3 = data2["type"];
                        if (data3 !== undefined) {
                            var errs_4 = errors;
                            if (typeof data3 !== "string") {
                                var dataType4 = typeof data3;
                                var coerced4 = undefined;
                                if (dataType4 == 'number' || dataType4 == 'boolean') coerced4 = '' + data3;
                                else if (data3 === null) coerced4 = '';
                                if (coerced4 === undefined) {
                                    var err = 'ValidationError[type]: request.body.credit_card.type should be string';
                                    if (vErrors === null) vErrors = [err];
                                    else vErrors.push(err);
                                    errors++;
                                } else {
                                    data3 = coerced4;
                                    data2['type'] = coerced4;
                                }
                            }
                            var valid4 = errors === errs_4;
                        }
                        var data3 = data2["cardholder_name"];
                        if (data3 !== undefined) {
                            var errs_4 = errors;
                            if (typeof data3 !== "string") {
                                var dataType4 = typeof data3;
                                var coerced4 = undefined;
                                if (dataType4 == 'number' || dataType4 == 'boolean') coerced4 = '' + data3;
                                else if (data3 === null) coerced4 = '';
                                if (coerced4 === undefined) {
                                    var err = 'ValidationError[type]: request.body.credit_card.cardholder_name should be string';
                                    if (vErrors === null) vErrors = [err];
                                    else vErrors.push(err);
                                    errors++;
                                } else {
                                    data3 = coerced4;
                                    data2['cardholder_name'] = coerced4;
                                }
                            }
                            var valid4 = errors === errs_4;
                        }
                        var data3 = data2["card_number"];
                        if (data3 !== undefined) {
                            var errs_4 = errors;
                            if (typeof data3 !== "string") {
                                var dataType4 = typeof data3;
                                var coerced4 = undefined;
                                if (dataType4 == 'number' || dataType4 == 'boolean') coerced4 = '' + data3;
                                else if (data3 === null) coerced4 = '';
                                if (coerced4 === undefined) {
                                    var err = 'ValidationError[type]: request.body.credit_card.card_number should be string';
                                    if (vErrors === null) vErrors = [err];
                                    else vErrors.push(err);
                                    errors++;
                                } else {
                                    data3 = coerced4;
                                    data2['card_number'] = coerced4;
                                }
                            }
                            var valid4 = errors === errs_4;
                        }
                        var data3 = data2["exp_date"];
                        if (data3 !== undefined) {
                            var errs_4 = errors;
                            if (typeof data3 !== "string") {
                                var dataType4 = typeof data3;
                                var coerced4 = undefined;
                                if (dataType4 == 'number' || dataType4 == 'boolean') coerced4 = '' + data3;
                                else if (data3 === null) coerced4 = '';
                                if (coerced4 === undefined) {
                                    var err = 'ValidationError[type]: request.body.credit_card.exp_date should be string';
                                    if (vErrors === null) vErrors = [err];
                                    else vErrors.push(err);
                                    errors++;
                                } else {
                                    data3 = coerced4;
                                    data2['exp_date'] = coerced4;
                                }
                            }
                            var valid4 = errors === errs_4;
                        }
                        var data3 = data2["cvv"];
                        if (data3 !== undefined) {
                            var errs_4 = errors;
                            if (typeof data3 !== "string") {
                                var dataType4 = typeof data3;
                                var coerced4 = undefined;
                                if (dataType4 == 'number' || dataType4 == 'boolean') coerced4 = '' + data3;
                                else if (data3 === null) coerced4 = '';
                                if (coerced4 === undefined) {
                                    var err = 'ValidationError[type]: request.body.credit_card.cvv should be string';
                                    if (vErrors === null) vErrors = [err];
                                    else vErrors.push(err);
                                    errors++;
                                } else {
                                    data3 = coerced4;
                                    data2['cvv'] = coerced4;
                                }
                            }
                            var valid4 = errors === errs_4;
                        }
                    } else {
                        var err = 'ValidationError[type]: request.body.credit_card should be object';
                        if (vErrors === null) vErrors = [err];
                        else vErrors.push(err);
                        errors++;
                    }
                    var valid3 = errors === errs_3;
                }
            } else {
                var err = 'ValidationError[type]: request.body should be object';
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
            }
            var valid2 = errors === errs_2;
            if (valid2) {
                valid1 = prevValid1 = true;
                passingSchemas1 = 0;
            }
            if (!valid1) {
                var err = 'ValidationError[oneOf]: request.body should match exactly one schema in oneOf';
                if (vErrors === null) vErrors = [err];
                else vErrors.push(err);
                errors++;
            } else {
                errors = errs__1;
                if (vErrors !== null) {
                    if (errs__1) vErrors.length = errs__1;
                    else vErrors = null;
                }
            }
            var valid1 = errors === errs_1;
        }
    } else {
        var err = 'ValidationError[type]: request#/type should be object';
        if (vErrors === null) vErrors = [err];
        else vErrors.push(err);
        errors++;
    }
    if (vErrors == null || vErrors.length === 0) {
        return true;
    } else {
        return vErrors;
    }
};
module["exports"] = {
    "f1901113617": f1901113617,
    "defHash": "3804672971",
    "globalConsume": [],
    "swaggerBlob": "{\"swagger\":\"2.0\",\"info\":{\"title\":\"CNP POC API\",\"version\":\"1.0.0\"},\"paths\":{\"/v1/transactions\":{\"post\":{\"summary\":\"/v1/transactions \",\"description\":\"Use this method to submit payments credit and debit cards. Supported transaction type is purchase\",\"tags\":[\"Credit Card Payments\"],\"parameters\":[{\"name\":\"body\",\"in\":\"body\",\"schema\":{\"$ref\":\"#/definitions/Payment\"},\"required\":true}],\"responses\":{\"200\":{\"description\":\"The response\",\"schema\":{\"type\":\"object\",\"properties\":{\"status_code\":{\"$ref\":\"#/definitions/status_code\"},\"response_data\":{\"type\":\"object\",\"description\":\"test\"}}}}}}}},\"definitions\":{\"status_code\":{\"description\":\"Status code for the call. Successful call will return 1\",\"type\":\"integer\"},\"merchant_ref\":{\"description\":\"Merchant reference code – used by Payeezy system will be reflected in your settlement records and webhook notifications. \\nIt is an \\\"optional\\\" field\",\"type\":\"string\"},\"transaction_type\":{\"description\":\"Type of transaction that merchant would want to process\",\"type\":\"string\"},\"method\":{\"description\":\"Inputted transaction method\",\"type\":\"string\"},\"amount\":{\"description\":\"amount\",\"type\":\"string\"},\"partial_redemption\":{\"description\":\"Default set to false. When set to true, the transaction is enabled to complete using more than one credit card. A partially-authorized transaction will generate a Split Tender ID. Subsequent transactions to complete the authorization should include the Split Tender ID so that all the transactions comprising that authorization can be linked using the Split-Tender tab.\",\"type\":\"string\"},\"currency_code\":{\"description\":\"Currency Code\",\"type\":\"string\"},\"credit_card\":{\"description\":\"credit card object\",\"type\":\"object\",\"properties\":{\"type\":{\"description\":\"Type of CC\",\"type\":\"string\"},\"cardholder_name\":{\"description\":\"Name of the CC holder\",\"type\":\"string\"},\"card_number\":{\"description\":\"CC Number\",\"type\":\"string\"},\"exp_date\":{\"description\":\"Expiration date\",\"type\":\"string\"},\"cvv\":{\"description\":\"CVV\",\"type\":\"string\"}}},\"CreditCard\":{\"description\":\"Credit Card Payment\",\"allOf\":[{\"$ref\":\"#/definitions/Payment\"},{\"type\":\"object\",\"properties\":{\"credit_card\":{\"$ref\":\"#/definitions/credit_card\"}},\"required\":[\"credit_card\"]}]},\"Payment\":{\"discriminator\":\"method\",\"description\":\"Payload for purchase\",\"type\":\"object\",\"properties\":{\"merchant_ref\":{\"$ref\":\"#/definitions/merchant_ref\"},\"transaction_type\":{\"$ref\":\"#/definitions/transaction_type\"},\"method\":{\"description\":\"Type of a payment method\",\"type\":\"string\"},\"amount\":{\"$ref\":\"#/definitions/amount\"}},\"required\":[\"method\",\"amount\"]}},\"tags\":[{\"name\":\"Errors\",\"description\":\"|Status Code|Name|Description|\\n|-|-|--|\\n|1001|ValidationError|Invalid Parameters|\\n|1002|TokenMalformed|Authorization Failure|\\n|1003|InternalError|An internal error occured|\\n|1004|AccessDenied|Access to this resource is denied|\\n\"}],\"consumes\":[],\"produces\":[]}",
    "getValidator": validate
};