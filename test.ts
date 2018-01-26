const hasher = require("metrohash")["metrohash64"];
const FUNCTION_PREFIX = "f"
function pushArr(target, other) {
	const len = other.length;
	let i;
	for (i = 0; i < len; i++) {
		target.push(other[i]);
	}
}

function validate(path, method, data) {
	const key = FUNCTION_PREFIX + hasher(`${path}:${method}`);
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
var f2fdd0ef9adf644c4 = function(data, dataPath, parentData, parentDataProperty, rootData) {
	let validationErrors = []; /**@const*/
	const schema = {
			"properties": {
				"headers": {
					"required": ["authorization"],
					"type": "object",
					"properties": {
						"authorization": {
							"type": "string"
						}
					}
				}
			},
			"required": ["headers"],
			"type": "object"
		};
	'use strict';
	var vErrors = null;
	var errors = 0;
	if ((data && typeof data === "object" && !Array.isArray(data))) {
		var errs__0 = errors;
		var valid1 = true;
		var data1 = data["headers"];
		if (data1 === undefined) {
			valid1 = false;
			var err = 'ValidationError[required]: request.headers is a required property';
			if (vErrors === null) vErrors = [err];
			else vErrors.push(err);
			errors++;
		} else {
			var errs_1 = errors;
			if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
				var errs__1 = errors;
				var valid2 = true;
				var data2 = data1["authorization"];
				if (data2 === undefined) {
					valid2 = false;
					var err = 'ValidationError[required]: request.headers.authorization is a required property';
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
							var err = 'ValidationError[type]: request.headers.authorization should be string';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						} else {
							data2 = coerced2;
							data1['authorization'] = coerced2;
						}
					}
					var valid2 = errors === errs_2;
				}
			} else {
				var err = 'ValidationError[type]: request.headers should be object';
				if (vErrors === null) vErrors = [err];
				else vErrors.push(err);
				errors++;
			}
			var valid1 = errors === errs_1;
		}
	} else {
		var err = 'ValidationError[type]: request#/type should be object';
		if (vErrors === null) vErrors = [err];
		else vErrors.push(err);
		errors++;
	}
	if (validationErrors.length === 0) {
		return true;
	} else {
		return vErrors;
	}
};
var f1145c6744cd6bd19 = function(data, dataPath, parentData, parentDataProperty, rootData) {
	let validationErrors = []; /**@const*/
	const schema = {
			"properties": {
				"body": {
					"type": "object",
					"required": ["sickBurn", "burnType"],
					"properties": {
						"sickBurn": {
							"type": "string"
						},
						"burnType": {
							"type": "object",
							"required": ["type", "pet"],
							"properties": {
								"type": {
									"type": "string",
									"const": "sick"
								},
								"pet": {
									"required": ["dtype", "name"],
									"oneOf": {
										"t0": {
											"type": "object",
											"required": ["huntingSkill"],
											"properties": {
												"dtype": {
													"const": "Cat"
												},
												"huntingSkill": {
													"type": "string",
													"api_enum": ["clueless", "lazy", "adventurous", "aggressive"]
												}
											}
										},
										"t1": {
											"type": "object",
											"required": ["numberOfFleas"],
											"properties": {
												"dtype": {
													"const": "Monkey"
												},
												"numberOfFleas": {
													"type": "number",
													"minimum": 0
												}
											}
										},
										"t2": {
											"type": "object",
											"required": ["tailWagging"],
											"properties": {
												"dtype": {
													"const": "Dog"
												},
												"tailWagging": {
													"type": "boolean"
												}
											}
										}
									},
									"properties": {
										"dtype": {
											"type": "string"
										},
										"name": {
											"type": "string",
											"minLength": 4,
											"maxLength": 20
										}
									}
								}
							}
						},
						"phoneNumber": {
							"type": "string",
							"pattern": "^\\+?[1-9]\\d{1,14}$"
						},
						"thing": {
							"type": "string"
						}
					}
				},
				"headers": {
					"required": ["authorization"],
					"type": "object",
					"properties": {
						"potato": {
							"type": "string"
						},
						"authorization": {
							"type": "string"
						}
					}
				}
			},
			"required": ["body", "headers"],
			"type": "object"
		}; /**@const*/
	const pattern0 = new RegExp("^\\+?[1-9]\\d{1,14}$");
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
				var data2 = data1["sickBurn"];
				if (data2 === undefined) {
					valid2 = false;
					var err = 'ValidationError[required]: request.body.sickBurn is a required property';
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
							var err = 'ValidationError[type]: request.body.sickBurn should be string';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						} else {
							data2 = coerced2;
							data1['sickBurn'] = coerced2;
						}
					}
					var valid2 = errors === errs_2;
				}
				var data2 = data1["burnType"];
				if (data2 === undefined) {
					valid2 = false;
					var err = 'ValidationError[required]: request.body.burnType is a required property';
					if (vErrors === null) vErrors = [err];
					else vErrors.push(err);
					errors++;
				} else {
					var errs_2 = errors;
					if ((data2 && typeof data2 === "object" && !Array.isArray(data2))) {
						var errs__2 = errors;
						var valid3 = true;
						var data3 = data2["type"];
						if (data3 === undefined) {
							valid3 = false;
							var err = 'ValidationError[required]: request.body.burnType.type is a required property';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						} else {
							var errs_3 = errors;
							if (typeof data3 !== "string") {
								var dataType3 = typeof data3;
								var coerced3 = undefined;
								if (dataType3 == 'number' || dataType3 == 'boolean') coerced3 = '' + data3;
								else if (data3 === null) coerced3 = '';
								if (coerced3 === undefined) {
									var err = 'ValidationError[type]: request.body.burnType.type should be string';
									if (vErrors === null) vErrors = [err];
									else vErrors.push(err);
									errors++;
								} else {
									data3 = coerced3;
									data2['type'] = coerced3;
								}
							}
							var schema3 = schema.properties.body.properties.burnType.properties.type.const;
							var valid3 = equal(data3, schema3);
							if (!valid3) {
								var err = 'ValidationError[const]: request.body.burnType.type should be equal to constant';
								if (vErrors === null) vErrors = [err];
								else vErrors.push(err);
								errors++;
							}
							var valid3 = errors === errs_3;
						}
						var data3 = data2["pet"];
						if (data3 === undefined) {
							valid3 = false;
							var err = 'ValidationError[required]: request.body.burnType.pet is a required property';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						} else {
							var errs_3 = errors;
							if ((data3 && typeof data3 === "object" && !Array.isArray(data3))) {
								var errs__3 = errors;
								var valid4 = true;
								var data4 = data3["dtype"];
								if (data4 === undefined) {
									valid4 = false;
									var err = 'ValidationError[required]: request.body.burnType.pet.dtype is a required property';
									if (vErrors === null) vErrors = [err];
									else vErrors.push(err);
									errors++;
								} else {
									var errs_4 = errors;
									if (typeof data4 !== "string") {
										var dataType4 = typeof data4;
										var coerced4 = undefined;
										if (dataType4 == 'number' || dataType4 == 'boolean') coerced4 = '' + data4;
										else if (data4 === null) coerced4 = '';
										if (coerced4 === undefined) {
											var err = 'ValidationError[type]: request.body.burnType.pet.dtype should be string';
											if (vErrors === null) vErrors = [err];
											else vErrors.push(err);
											errors++;
										} else {
											data4 = coerced4;
											data3['dtype'] = coerced4;
										}
									}
									var valid4 = errors === errs_4;
								}
								var data4 = data3["name"];
								if (data4 === undefined) {
									valid4 = false;
									var err = 'ValidationError[required]: request.body.burnType.pet.name is a required property';
									if (vErrors === null) vErrors = [err];
									else vErrors.push(err);
									errors++;
								} else {
									var errs_4 = errors;
									if (typeof data4 !== "string") {
										var dataType4 = typeof data4;
										var coerced4 = undefined;
										if (dataType4 == 'number' || dataType4 == 'boolean') coerced4 = '' + data4;
										else if (data4 === null) coerced4 = '';
										if (coerced4 === undefined) {
											var err = 'ValidationError[type]: request.body.burnType.pet.name should be string';
											if (vErrors === null) vErrors = [err];
											else vErrors.push(err);
											errors++;
										} else {
											data4 = coerced4;
											data3['name'] = coerced4;
										}
									}
									if (typeof data4 === "string") {
										if (data4["length"] > 20) {
											var err = 'ValidationError[maxLength]: request.body.burnType.pet.name should NOT be longer than 20 characters';
											if (vErrors === null) vErrors = [err];
											else vErrors.push(err);
											errors++;
										}
										if (data4["length"] < 4) {
											var err = 'ValidationError[minLength]: request.body.burnType.pet.name should NOT be shorter than 4 characters';
											if (vErrors === null) vErrors = [err];
											else vErrors.push(err);
											errors++;
										}
									}
									var valid4 = errors === errs_4;
								}
							}
							var errs__3 = errors;
							var prevValid3 = false;
							var valid3 = false;
							var errs_4 = errors;
							if ((data3 && typeof data3 === "object" && !Array.isArray(data3))) {
								var errs__4 = errors;
								var valid5 = true;
								if (data3["dtype"] !== undefined) {
									var errs_5 = errors;
									var schema5 = schema.properties.body.properties.burnType.properties.pet.oneOf.t0.properties.dtype.const;
									var valid5 = equal(data3["dtype"], schema5);
									if (!valid5) {
										var err = null;
										errors++;
									}
									var valid5 = errors === errs_5;
								}
								var data4 = data3["huntingSkill"];
								if (data4 === undefined) {
									valid5 = false;
									var err = 'ValidationError[required]: request.body.burnType.pet.huntingSkill is a required property';
									if (vErrors === null) vErrors = [err];
									else vErrors.push(err);
									errors++;
								} else {
									var errs_5 = errors;
									if (typeof data4 !== "string") {
										var dataType5 = typeof data4;
										var coerced5 = undefined;
										if (dataType5 == 'number' || dataType5 == 'boolean') coerced5 = '' + data4;
										else if (data4 === null) coerced5 = '';
										if (coerced5 === undefined) {
											var err = 'ValidationError[type]: request.body.burnType.pet.huntingSkill should be string';
											if (vErrors === null) vErrors = [err];
											else vErrors.push(err);
											errors++;
										} else {
											data4 = coerced5;
											data3['huntingSkill'] = coerced5;
										}
									}
									var schema5 = schema.properties.body.properties.burnType.properties.pet.oneOf.t0.properties.huntingSkill.api_enum;
									var valid5;
									valid5 = false;
									for (var i5 = 0; i5 < schema5.length; i5++)
										if (equal(data4, schema5[i5])) {
											valid5 = true;
											break;
										}
									if (!valid5) {
										var err = 'ValidationError[enum]: request.body.burnType.pet.huntingSkill should be equal to one of the allowed values: [' + schema5 + ']';
										if (vErrors === null) vErrors = [err];
										else vErrors.push(err);
										errors++;
									}
									var valid5 = errors === errs_5;
								}
							} else {
								var err = 'ValidationError[type]: request.body.burnType.pet should be object';
								if (vErrors === null) vErrors = [err];
								else vErrors.push(err);
								errors++;
							}
							var valid4 = errors === errs_4;
							if (valid4) valid3 = prevValid3 = true;
							var errs_4 = errors;
							if ((data3 && typeof data3 === "object" && !Array.isArray(data3))) {
								var errs__4 = errors;
								var valid5 = true;
								if (data3["dtype"] !== undefined) {
									var errs_5 = errors;
									var schema5 = schema.properties.body.properties.burnType.properties.pet.oneOf.t1.properties.dtype.const;
									var valid5 = equal(data3["dtype"], schema5);
									if (!valid5) {
										var err = null;
										errors++;
									}
									var valid5 = errors === errs_5;
								}
								var data4 = data3["numberOfFleas"];
								if (data4 === undefined) {
									valid5 = false;
									var err = 'ValidationError[required]: request.body.burnType.pet.numberOfFleas is a required property';
									if (vErrors === null) vErrors = [err];
									else vErrors.push(err);
									errors++;
								} else {
									var errs_5 = errors;
									if (typeof data4 !== "number") {
										var dataType5 = typeof data4;
										var coerced5 = undefined;
										if (dataType5 == 'boolean' || data4 === null || (dataType5 == 'string' && data4 && data4 == +data4)) coerced5 = +data4;
										if (coerced5 === undefined) {
											var err = 'ValidationError[type]: request.body.burnType.pet.numberOfFleas should be number';
											if (vErrors === null) vErrors = [err];
											else vErrors.push(err);
											errors++;
										} else {
											data4 = coerced5;
											data3['numberOfFleas'] = coerced5;
										}
									}
									if (typeof data4 === "number") {
										if (data4 < 0 || data4 !== data4) {
											var err = 'ValidationError[minimum]: request.body.burnType.pet.numberOfFleas should be >= 0';
											if (vErrors === null) vErrors = [err];
											else vErrors.push(err);
											errors++;
										}
									}
									var valid5 = errors === errs_5;
								}
							} else {
								var err = 'ValidationError[type]: request.body.burnType.pet should be object';
								if (vErrors === null) vErrors = [err];
								else vErrors.push(err);
								errors++;
							}
							var valid4 = errors === errs_4;
							if (valid4 && prevValid3) valid3 = false;
							else {
								if (valid4) valid3 = prevValid3 = true;
								var errs_4 = errors;
								if ((data3 && typeof data3 === "object" && !Array.isArray(data3))) {
									var errs__4 = errors;
									var valid5 = true;
									if (data3["dtype"] !== undefined) {
										var errs_5 = errors;
										var schema5 = schema.properties.body.properties.burnType.properties.pet.oneOf.t2.properties.dtype.const;
										var valid5 = equal(data3["dtype"], schema5);
										if (!valid5) {
											var err = null;
											errors++;
										}
										var valid5 = errors === errs_5;
									}
									var data4 = data3["tailWagging"];
									if (data4 === undefined) {
										valid5 = false;
										var err = 'ValidationError[required]: request.body.burnType.pet.tailWagging is a required property';
										if (vErrors === null) vErrors = [err];
										else vErrors.push(err);
										errors++;
									} else {
										var errs_5 = errors;
										if (typeof data4 !== "boolean") {
											var dataType5 = typeof data4;
											var coerced5 = undefined;
											if (data4 === 'false' || data4 === 0 || data4 === null) coerced5 = false;
											else if (data4 === 'true' || data4 === 1) coerced5 = true;
											if (coerced5 === undefined) {
												var err = 'ValidationError[type]: request.body.burnType.pet.tailWagging should be boolean';
												if (vErrors === null) vErrors = [err];
												else vErrors.push(err);
												errors++;
											} else {
												data4 = coerced5;
												data3['tailWagging'] = coerced5;
											}
										}
										var valid5 = errors === errs_5;
									}
								} else {
									var err = 'ValidationError[type]: request.body.burnType.pet should be object';
									if (vErrors === null) vErrors = [err];
									else vErrors.push(err);
									errors++;
								}
								var valid4 = errors === errs_4;
								if (valid4 && prevValid3) valid3 = false;
								else {
									if (valid4) valid3 = prevValid3 = true;
								}
							}
							if (!valid3) {
								var err = 'ValidationError[oneOf]: request.body.burnType.pet should match exactly one schema in oneOf';
								errors++;
							} else {
								errors = errs__3;
								if (vErrors !== null) {
									if (errs__3) vErrors.length = errs__3;
									else vErrors = null;
								}
							}
							var valid3 = errors === errs_3;
						}
					} else {
						var err = 'ValidationError[type]: request.body.burnType should be object';
						if (vErrors === null) vErrors = [err];
						else vErrors.push(err);
						errors++;
					}
					var valid2 = errors === errs_2;
				}
				var data2 = data1["phoneNumber"];
				if (data2 !== undefined) {
					var errs_2 = errors;
					if (typeof data2 !== "string") {
						var dataType2 = typeof data2;
						var coerced2 = undefined;
						if (dataType2 == 'number' || dataType2 == 'boolean') coerced2 = '' + data2;
						else if (data2 === null) coerced2 = '';
						if (coerced2 === undefined) {
							var err = 'ValidationError[type]: request.body.phoneNumber should be string';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						} else {
							data2 = coerced2;
							data1['phoneNumber'] = coerced2;
						}
					}
					if (typeof data2 === "string") {
						if (!pattern0.test(data2)) {
							var err = 'ValidationError[pattern]: request.body.phoneNumber should match pattern "^\\+?[1-9]\\d{1,14}$"';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						}
					}
					var valid2 = errors === errs_2;
				}
				var data2 = data1["thing"];
				if (data2 !== undefined) {
					var errs_2 = errors;
					if (typeof data2 !== "string") {
						var dataType2 = typeof data2;
						var coerced2 = undefined;
						if (dataType2 == 'number' || dataType2 == 'boolean') coerced2 = '' + data2;
						else if (data2 === null) coerced2 = '';
						if (coerced2 === undefined) {
							var err = 'ValidationError[type]: request.body.thing should be string';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						} else {
							data2 = coerced2;
							data1['thing'] = coerced2;
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
			var valid1 = errors === errs_1;
		}
		var data1 = data["headers"];
		if (data1 === undefined) {
			valid1 = false;
			var err = 'ValidationError[required]: request.headers is a required property';
			if (vErrors === null) vErrors = [err];
			else vErrors.push(err);
			errors++;
		} else {
			var errs_1 = errors;
			if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
				var errs__1 = errors;
				var valid2 = true;
				var data2 = data1["potato"];
				if (data2 !== undefined) {
					var errs_2 = errors;
					if (typeof data2 !== "string") {
						var dataType2 = typeof data2;
						var coerced2 = undefined;
						if (dataType2 == 'number' || dataType2 == 'boolean') coerced2 = '' + data2;
						else if (data2 === null) coerced2 = '';
						if (coerced2 === undefined) {
							var err = 'ValidationError[type]: request.headers.potato should be string';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						} else {
							data2 = coerced2;
							data1['potato'] = coerced2;
						}
					}
					var valid2 = errors === errs_2;
				}
				var data2 = data1["authorization"];
				if (data2 === undefined) {
					valid2 = false;
					var err = 'ValidationError[required]: request.headers.authorization is a required property';
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
							var err = 'ValidationError[type]: request.headers.authorization should be string';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						} else {
							data2 = coerced2;
							data1['authorization'] = coerced2;
						}
					}
					var valid2 = errors === errs_2;
				}
			} else {
				var err = 'ValidationError[type]: request.headers should be object';
				if (vErrors === null) vErrors = [err];
				else vErrors.push(err);
				errors++;
			}
			var valid1 = errors === errs_1;
		}
	} else {
		var err = 'ValidationError[type]: request#/type should be object';
		if (vErrors === null) vErrors = [err];
		else vErrors.push(err);
		errors++;
	}
	if (validationErrors.length === 0) {
		return true;
	} else {
		return vErrors;
	}
};
var f72a86a0854e069f9 = function(data, dataPath, parentData, parentDataProperty, rootData) {
	let validationErrors = []; /**@const*/
	const schema = {
			"properties": {
				"path": {
					"required": ["name"],
					"type": "object",
					"properties": {
						"name": {
							"type": "string"
						}
					}
				}
			},
			"required": ["path"],
			"type": "object"
		};
	'use strict';
	var vErrors = null;
	var errors = 0;
	if ((data && typeof data === "object" && !Array.isArray(data))) {
		var errs__0 = errors;
		var valid1 = true;
		var data1 = data["path"];
		if (data1 === undefined) {
			valid1 = false;
			var err = 'ValidationError[required]: request.path is a required property';
			if (vErrors === null) vErrors = [err];
			else vErrors.push(err);
			errors++;
		} else {
			var errs_1 = errors;
			if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
				var errs__1 = errors;
				var valid2 = true;
				var data2 = data1["name"];
				if (data2 === undefined) {
					valid2 = false;
					var err = 'ValidationError[required]: request.path.name is a required property';
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
							var err = 'ValidationError[type]: request.path.name should be string';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						} else {
							data2 = coerced2;
							data1['name'] = coerced2;
						}
					}
					var valid2 = errors === errs_2;
				}
			} else {
				var err = 'ValidationError[type]: request.path should be object';
				if (vErrors === null) vErrors = [err];
				else vErrors.push(err);
				errors++;
			}
			var valid1 = errors === errs_1;
		}
	} else {
		var err = 'ValidationError[type]: request#/type should be object';
		if (vErrors === null) vErrors = [err];
		else vErrors.push(err);
		errors++;
	}
	if (validationErrors.length === 0) {
		return true;
	} else {
		return vErrors;
	}
};
var fd4d0a1b2871c41ba = function(data, dataPath, parentData, parentDataProperty, rootData) {
	let validationErrors = []; /**@const*/
	const schema = {
			"properties": {
				"formData": {
					"required": ["potato"],
					"type": "object",
					"properties": {
						"potato": {
							"type": "string"
						}
					}
				}
			},
			"required": ["formData"],
			"type": "object"
		};
	'use strict';
	var vErrors = null;
	var errors = 0;
	if ((data && typeof data === "object" && !Array.isArray(data))) {
		var errs__0 = errors;
		var valid1 = true;
		var data1 = data["formData"];
		if (data1 === undefined) {
			valid1 = false;
			var err = 'ValidationError[required]: request.formData is a required property';
			if (vErrors === null) vErrors = [err];
			else vErrors.push(err);
			errors++;
		} else {
			var errs_1 = errors;
			if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
				var errs__1 = errors;
				var valid2 = true;
				var data2 = data1["potato"];
				if (data2 === undefined) {
					valid2 = false;
					var err = 'ValidationError[required]: request.formData.potato is a required property';
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
							var err = 'ValidationError[type]: request.formData.potato should be string';
							if (vErrors === null) vErrors = [err];
							else vErrors.push(err);
							errors++;
						} else {
							data2 = coerced2;
							data1['potato'] = coerced2;
						}
					}
					var valid2 = errors === errs_2;
				}
			} else {
				var err = 'ValidationError[type]: request.formData should be object';
				if (vErrors === null) vErrors = [err];
				else vErrors.push(err);
				errors++;
			}
			var valid1 = errors === errs_1;
		}
	} else {
		var err = 'ValidationError[type]: request#/type should be object';
		if (vErrors === null) vErrors = [err];
		else vErrors.push(err);
		errors++;
	}
	if (validationErrors.length === 0) {
		return true;
	} else {
		return vErrors;
	}
};
module["exports"] = {
	"f2fdd0ef9adf644c4": f2fdd0ef9adf644c4,
	"f1145c6744cd6bd19": f1145c6744cd6bd19,
	"f72a86a0854e069f9": f72a86a0854e069f9,
	"fd4d0a1b2871c41ba": fd4d0a1b2871c41ba,
	"defHash": "07c3e9b9533cd8fe",
	"globalConsume": ["application/json"],
	"swaggerBlob": "{\"swagger\":\"2.0\",\"info\":{\"title\":\"Test api\",\"version\":\"1\"},\"paths\":{\"/burn\":{\"get\":{\"description\":\"Awful, horrible burns\",\"summary\":\"Get burned\",\"responses\":{\"200\":{\"description\":\"Returns a thing\"}},\"parameters\":[{\"required\":true,\"type\":\"string\",\"in\":\"header\",\"name\":\"authorization\",\"description\":\"JWT required\"}]},\"post\":{\"description\":\"Awful, horrible burns\",\"summary\":\"Submit a burn for evaluation\",\"parameters\":[{\"required\":true,\"name\":\"body\",\"schema\":{\"type\":\"object\",\"allOf\":[{\"$ref\":\"#/definitions/BurnSubmit\"},{\"type\":\"object\",\"properties\":{\"thing\":{\"type\":\"string\"}}}]},\"in\":\"body\"},{\"in\":\"header\",\"name\":\"potato\",\"required\":false,\"type\":\"string\"},{\"required\":true,\"type\":\"string\",\"in\":\"header\",\"name\":\"authorization\",\"description\":\"JWT required\"}],\"responses\":{\"200\":{\"description\":\"Returns a thing\"}}}},\"/burn/{name}\":{\"get\":{\"description\":\"Burn someone\",\"summary\":\"Burn someone by name\",\"parameters\":[{\"name\":\"name\",\"in\":\"path\",\"required\":true,\"type\":\"string\",\"description\":\"Name of person to burn\"}],\"responses\":{\"200\":{\"description\":\"Returns a thing\"}}}},\"/formtest\":{\"post\":{\"description\":\"Awful, horrible burns\",\"summary\":\"Submit a burn for evaluation\",\"parameters\":[{\"in\":\"formData\",\"name\":\"potato\",\"required\":true,\"type\":\"string\"}],\"responses\":{\"200\":{\"description\":\"Returns a thing\"}}}}},\"definitions\":{\"Animal\":{\"discriminator\":\"dtype\",\"required\":[\"dtype\",\"name\"],\"properties\":{\"dtype\":{\"type\":\"string\"},\"name\":{\"type\":\"string\",\"minLength\":4,\"maxLength\":20}}},\"Cat\":{\"allOf\":[{\"$ref\":\"#/definitions/Animal\"},{\"type\":\"object\",\"required\":[\"huntingSkill\"],\"properties\":{\"huntingSkill\":{\"type\":\"string\",\"enum\":[\"clueless\",\"lazy\",\"adventurous\",\"aggressive\"]}}}]},\"Monkey\":{\"allOf\":[{\"$ref\":\"#/definitions/Animal\"},{\"type\":\"object\",\"required\":[\"numberOfFleas\"],\"properties\":{\"numberOfFleas\":{\"type\":\"number\",\"minimum\":0}}}]},\"Dog\":{\"allOf\":[{\"$ref\":\"#/definitions/Animal\"},{\"type\":\"object\",\"required\":[\"tailWagging\"],\"properties\":{\"tailWagging\":{\"type\":\"boolean\"}}}]},\"BurnSubmit\":{\"type\":\"object\",\"required\":[\"sickBurn\",\"burnType\"],\"properties\":{\"sickBurn\":{\"type\":\"string\"},\"burnType\":{\"type\":\"object\",\"required\":[\"type\",\"pet\"],\"properties\":{\"type\":{\"type\":\"string\",\"enum\":[\"sick\"]},\"pet\":{\"$ref\":\"#/definitions/Animal\"}}},\"phoneNumber\":{\"type\":\"string\",\"pattern\":\"^\\\\+?[1-9]\\\\d{1,14}$\"}}}},\"tags\":[{\"name\":\"Errors\",\"description\":\"|Status Code|Name|Description|\\n|-|-|--|\\n|1001|ValidationError|Invalid Parameters|\\n|1002|TokenMalformed|Authorization Failure|\\n|1003|InternalError|An internal error occured|\\n|1004|AccessDenied|Access to this resource is denied|\\n\"}],\"consumes\":[\"application/json\"],\"produces\":[\"application/json\"]}",
	"getValidator": validate
};