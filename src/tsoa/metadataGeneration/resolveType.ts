// tslint:disable:max-line-length

import {indexOf, intersection, map} from "lodash";
import * as ts from "typescript";
import {getJSDocComment, getJSDocTagNames, isExistJSDocTag} from "../utils/jsDocUtils";
import {getPropertyValidators} from "../utils/validatorUtils";
import {GenerateMetadataError} from "./exceptions";
import {MetadataGenerator} from "./metadataGenerator";
import {Tsoa} from "./tsoa";
import {Swagger} from "../../server/swagger";

const syntaxKindMap: { [kind: number]: string } = {};
syntaxKindMap[ts.SyntaxKind.NumberKeyword] = "number";
syntaxKindMap[ts.SyntaxKind.StringKeyword] = "string";
syntaxKindMap[ts.SyntaxKind.BooleanKeyword] = "boolean";
syntaxKindMap[ts.SyntaxKind.VoidKeyword] = "void";

const localDiscriminatorCache: { [typeName: string]: Tsoa.ReferenceType } = {};
const localReferenceTypeCache: { [typeName: string]: Tsoa.ReferenceType | Tsoa.ReferenceAlias } = {};
const inProgressTypes: { [typeName: string]: boolean } = {};

type UsableDeclaration = ts.InterfaceDeclaration
    | ts.ClassDeclaration
    | ts.TypeAliasDeclaration
    | ts.ObjectTypeDeclaration;

// TODO: Support nested Generics
// TODO: Unique identifier for generic literals

export function resolveType(typeNode: ts.TypeNode, parentNode?: ts.Node, extractEnum = true): Tsoa.Type {
    const primitiveType = getPrimitiveType(typeNode, parentNode);
    if (primitiveType) {
        return primitiveType;
    }

    if (typeNode.kind === ts.SyntaxKind.ArrayType) {
        return {
            dataType: "array",
            elementType: resolveType((typeNode as ts.ArrayTypeNode).elementType),
        } as Tsoa.ArrayType;
    }

    if (typeNode.kind === ts.SyntaxKind.UnionType) {
        const unionType = typeNode as ts.UnionTypeNode;
        const supportType = unionType.types.some((type) => type.kind === ts.SyntaxKind.LiteralType);
        if (supportType) {
            return {
                dataType: "enum",
                enums: unionType.types.map((type) => {
                    /* tslint:disable-next-line:no-shadowed-variable */
                    const literalType = (type as ts.LiteralTypeNode).literal;
                    switch (literalType.kind) {
                        case ts.SyntaxKind.TrueKeyword:
                            return "true";
                        case ts.SyntaxKind.FalseKeyword:
                            return "false";
                        default:
                            return String((literalType as any).text);
                    }
                }),
            } as Tsoa.EnumerateType;
        } else {
            return {dataType: "object"} as Tsoa.Type;
        }
    }

    if (typeNode.kind === ts.SyntaxKind.AnyKeyword) {
        return {dataType: "any"} as Tsoa.Type;
    }

    if (typeNode.kind === ts.SyntaxKind.TypeLiteral) {
        const literal = getTypeLiteral(typeNode as any, parentNode);
        // MetadataGenerator.current.AddReferenceType(literal);
        return literal;
    }

    if (typeNode.kind === ts.SyntaxKind.LiteralType) {
        // Literal types generate a const enum
        const literal = typeNode as ts.LiteralTypeNode;
        let constValue: string | number;

        switch (literal.literal.kind) {
            case ts.SyntaxKind.StringLiteral:
                constValue = literal.literal.text;
                break;
            case ts.SyntaxKind.NumericLiteral:
                constValue = parseFloat(literal.literal.text);
                break;
            default:
                constValue = String((literal.literal as any).text);
        }

        return {
            dataType: "enum",
            enums: [constValue],
        } as Tsoa.EnumerateType;
    }

    if (typeNode.kind !== ts.SyntaxKind.TypeReference) {
        throw new GenerateMetadataError(`Unknown type: ${ts.SyntaxKind[typeNode.kind]}`);
    }

    const typeReference = typeNode as ts.TypeReferenceNode;
    if (typeReference.typeName.kind === ts.SyntaxKind.Identifier) {
        if (typeReference.typeName.text === "Date") {
            return getDateType(typeNode, parentNode);
        }

        if (typeReference.typeName.text === "Buffer") {
            return {dataType: "buffer"} as Tsoa.Type;
        }

        if (typeReference.typeName.text === "Array" &&
            typeReference.typeArguments && typeReference.typeArguments.length === 1) {
            return {
                dataType: "array",
                elementType: resolveType(typeReference.typeArguments[0]),
            } as Tsoa.ArrayType;
        }

        if (typeReference.typeName.text === "Promise" &&
            typeReference.typeArguments && typeReference.typeArguments.length === 1) {
            return resolveType(typeReference.typeArguments[0]);
        }

        if (typeReference.typeName.text === "String") {
            return {dataType: "string"} as Tsoa.Type;
        }
    }

    if (!extractEnum) {
        const enumType = getEnumerateType(typeReference.typeName, extractEnum);
        if (enumType) {
            return enumType;
        }
    }

    const literalType = getLiteralType(typeReference.typeName);
    if (literalType) {
        if (literalType.dataType === "refObject") {
            // This is a discriminator, so it should be a ref type
            MetadataGenerator.current.AddReferenceType(literalType);
        }
        return literalType;
    }

    let referenceType: Tsoa.ReferenceType | Tsoa.ReferenceAlias;
    if (typeReference.typeArguments && typeReference.typeArguments.length === 1) {
        const typeT: ts.NodeArray<ts.TypeNode> = typeReference.typeArguments as ts.NodeArray<ts.TypeNode>;
        referenceType = getReferenceType(typeReference.typeName as ts.EntityName, extractEnum, typeT);
    } else {
        referenceType = getReferenceType(typeReference.typeName as ts.EntityName, extractEnum);
    }

    MetadataGenerator.current.AddReferenceType(referenceType);
    return referenceType;
}

export function getInitializerValue(initializer?: ts.Expression, type?: Tsoa.Type): any {
    if (!initializer) {
        return;
    }

    switch (initializer.kind as ts.SyntaxKind) {
        case ts.SyntaxKind.ArrayLiteralExpression:
            const arrayLiteral = initializer as ts.ArrayLiteralExpression;
            return arrayLiteral.elements.map((element) => getInitializerValue(element));
        case ts.SyntaxKind.StringLiteral:
            return (initializer as ts.StringLiteral).text;
        case ts.SyntaxKind.TrueKeyword:
            return true;
        case ts.SyntaxKind.FalseKeyword:
            return false;
        case ts.SyntaxKind.NumberKeyword:
        case ts.SyntaxKind.FirstLiteralToken:
            return Number((initializer as ts.NumericLiteral).text);
        case ts.SyntaxKind.NewExpression:
            const newExpression = initializer as ts.NewExpression;
            const ident = newExpression.expression as ts.Identifier;

            if (ident.text === "Date") {
                let date = new Date();
                if (newExpression.arguments) {
                    const newArguments = newExpression.arguments.filter((args) => args.kind !== undefined);
                    const argsValue = newArguments.map((args) => getInitializerValue(args));
                    if (argsValue.length > 0) {
                        date = new Date(argsValue as any);
                    }
                }
                const dateString = date.toISOString();
                if (type && type.dataType === "date") {
                    return dateString.split("T")[0];
                }
                return dateString;
            }
            return;
        case ts.SyntaxKind.ObjectLiteralExpression:
            const objectLiteral = initializer as ts.ObjectLiteralExpression;
            const nestedObject: any = {};
            objectLiteral.properties.forEach((p: any) => {
                nestedObject[p.name.text] = getInitializerValue(p.initializer);
            });
            return nestedObject;
        default:
            return;
    }
}

function getPrimitiveType(typeNode: ts.TypeNode, parentNode?: ts.Node): Tsoa.Type | undefined {
    const primitiveType = syntaxKindMap[typeNode.kind];
    if (!primitiveType) {
        return;
    }

    if (primitiveType === "number") {
        if (!parentNode) {
            return {dataType: "double"};
        }

        const tags = getJSDocTagNames(parentNode).filter((name) => {
            return ["isInt", "isLong", "isFloat", "isDouble"].some((m) => m === name);
        });
        if (tags.length === 0) {
            return {dataType: "double"};
        }

        switch (tags[0]) {
            case "isInt":
                return {dataType: "integer"};
            case "isLong":
                return {dataType: "long"};
            case "isFloat":
                return {dataType: "float"};
            case "isDouble":
                return {dataType: "double"};
            default:
                return {dataType: "double"};
        }
    }
    return {dataType: primitiveType} as Tsoa.Type;
}

function getDateType(typeNode: ts.TypeNode, parentNode?: ts.Node): Tsoa.Type {
    if (!parentNode) {
        return {dataType: "datetime"};
    }
    const tags = getJSDocTagNames(parentNode).filter((name) => {
        return ["isDate", "isDateTime"].some((m) => m === name);
    });

    if (tags.length === 0) {
        return {dataType: "datetime"};
    }
    switch (tags[0]) {
        case "isDate":
            return {dataType: "date"};
        case "isDateTime":
            return {dataType: "datetime"};
        default:
            return {dataType: "datetime"};
    }
}

function getAliasType(node: UsableDeclaration): Tsoa.ReferenceAlias | undefined {
    if (node.kind !== ts.SyntaxKind.TypeAliasDeclaration) {
        return;
    }

    const aliasDeclaration = node as ts.TypeAliasDeclaration;

    if (aliasDeclaration.type.kind === ts.SyntaxKind.IntersectionType) {
        return;
    }

    if (aliasDeclaration.type.kind === ts.SyntaxKind.TypeReference) {
        // console.log()
    }

    return {
        type: resolveType(node.type, node.type.parent),
        description: getNodeDescription(node),
        format: getNodeFormat(node),
        refName: node.name.text,
        validators: getPropertyValidators(node as any as ts.PropertyDeclaration),
        dataType: "refAlias",
        example: getNodeExample(node),
    };
    // const resolvedType = resolveType(node.type, node.type.parent);
}

function getEnumerateType(typeName: ts.EntityName, extractEnum = true): Tsoa.Type | undefined {
    const enumName = (typeName as ts.Identifier).text;
    const enumNodes = MetadataGenerator.current.nodes
        .filter((node) => node.kind === ts.SyntaxKind.EnumDeclaration)
        .filter((node) => (node as any).name.text === enumName);

    if (!enumNodes.length) {
        return;
    }
    if (enumNodes.length > 1) {
        throw new GenerateMetadataError(
            `Multiple matching enum found for enum ${enumName}; please make enum names unique.`);
    }

    const enumDeclaration = enumNodes[0] as ts.EnumDeclaration;

    function getEnumValue(member: any) {
        const initializer = member.initializer;
        if (initializer) {
            if (initializer.expression) {
                return initializer.expression.text;
            }
            return initializer.text;
        }
        return;
    }

    if (extractEnum) {
        const enums = enumDeclaration.members.map((member: any, index) => {
            return getEnumValue(member) || String(index);
        });
        return {
            dataType: "refEnum",
            description: getNodeDescription(enumDeclaration),
            enums,
            refName: enumName,
        } as Tsoa.ReferenceType;
    } else {
        return {
            dataType: "enum",
            enums: enumDeclaration.members.map((member: any, index) => {
                return getEnumValue(member) || String(index);
            }),
        } as Tsoa.EnumerateType;
    }
}

function getNodeExample(node: UsableDeclaration | ts.PropertyDeclaration |
    ts.ParameterDeclaration | ts.EnumDeclaration) {
    const example = getJSDocComment(node, "example");

    if (example) {
	    try {
		    return JSON.parse(example);
	    } catch (e) {
            return example;
	    }
    } else {
        return undefined;
    }
}

function getNodeSwagger(node: UsableDeclaration | ts.PropertyDeclaration |
    ts.ParameterDeclaration | ts.EnumDeclaration): Swagger.Schema {
    const swagger = getJSDocComment(node, "swagger");

    if (swagger) {
        return JSON.parse(swagger) as Swagger.Schema;
    } else {
        return undefined;
    }
}

function getTypeLiteral(node: UsableDeclaration, parent: ts.Node): Tsoa.ObjectType {
    // const name = (parent as any).name.escapedText;

    const properties = getModelProperties(node);
    const additionalProperties = getModelAdditionalProperties(node);
    const description = getNodeDescription(node.parent != null ? node.parent : node as any);

    return {
        dataType: "object",
        properties,
        additionalProperties,
        description,
    };
}

// TODO: detect discriminated unions for conversion to discriminators
function getLiteralType(typeName: ts.EntityName): Tsoa.EnumerateType | Tsoa.ReferenceType | undefined {
    const literalName = (typeName as ts.Identifier).text;
    const literalTypes = MetadataGenerator.current.nodes
        .filter((node) => node.kind === ts.SyntaxKind.TypeAliasDeclaration)
        .filter((node) => {
            const innerType = (node as any).type;
            return innerType.kind === ts.SyntaxKind.UnionType && (innerType as any).types;
        })
        .filter((node) => (node as any).name.text === literalName);

    if (!literalTypes.length) {
        return;
    }
    if (literalTypes.length > 1) {
        throw new GenerateMetadataError(
            `Multiple matching enum found for enum ${literalName}; please make enum names unique.`);
    }
    const unionTypes = (literalTypes[0] as any).type.types;

    if (localDiscriminatorCache[literalName]) {
        return localDiscriminatorCache[literalName];
    }

    // Check for a union of all reference types
    if (unionTypes.filter((node: ts.TypeNode) =>
        node.kind === ts.SyntaxKind.TypeReference).length === unionTypes.length) {
        // Look for a discriminator property
        const resolvedTypes = unionTypes.map((node: ts.TypeReferenceNode) => {
            return resolveType(node);
        });
        const discriminatorCandidates = resolvedTypes.map((modelType: Tsoa.ReferenceType) => {
            if (modelType.allOf) {
                modelType.allOf.forEach((type) => {
                    if (type.discriminator) {
                        throw new GenerateMetadataError(`${modelType.refName} is claimed by multiple discriminators`);
                    }
                });
            }
            return modelType.properties.filter((prop) => {
                if (prop.type.dataType === "enum") {
                    const propType = prop.type as Tsoa.EnumerateType;
                    return (propType.enums.length === 1 && propType.enums[0] === modelType.refName);
                } else {
                    return false;
                }
            }).map((prop) => {
                return prop.name;
            });
        });
        // Make sure all children have it
        const disciminatorMatches = intersection(...discriminatorCandidates);

        if (disciminatorMatches.length > 1) {
            throw new GenerateMetadataError(
                `Multiple discriminators for discriminated union ${literalName}. There can be only one`);
        }

        if (disciminatorMatches.length === 1) {
            // Bingo, we got ourselves a discriminator
            const discriminator = disciminatorMatches[0] as string;
            // console.log(`Found discrim union ${literalName} with discriminator ${discriminator}`);
            const refObj = {
                dataType: "refObject",
                description: getNodeDescription(literalTypes[0] as any),
                refName: literalName,
                properties: [{
                    type: {
                        dataType: "string",
                    },
                    required: true,
                    name: discriminator,
                    validators: {},
                }],
                discriminator,
            } as Tsoa.ReferenceType;
            resolvedTypes.forEach((modelType: Tsoa.ReferenceType) => {
                // We remove the discriminator from individual models to prevent double validations
                modelType.properties = modelType.properties.filter((prop) => prop.name !== discriminator);
                if (modelType.allOf && modelType.allOf.indexOf(refObj)) {
                    modelType.allOf.push(refObj);
                } else {
                    modelType.allOf = [refObj];
                }
            });
            localDiscriminatorCache[literalName] = refObj;
            return refObj;
        }
    }
    const filteredLiteral = unionTypes.filter((node: any) => {
        return unionTypes.literal;
    });
    if (filteredLiteral.length === 0) {
        return null;
    }

    return {
        dataType: "enum",
        enums: filteredLiteral.map((unionNode: any) => unionNode.literal.text as string),
    } as Tsoa.EnumerateType;
}

function getReferenceType(type: ts.EntityName, extractEnum = true,
                          genericTypes?: ts.NodeArray<ts.TypeNode>): Tsoa.ReferenceType | Tsoa.ReferenceAlias {
    const typeName = resolveFqTypeName(type);
    const refNameWithGenerics = getTypeName(typeName, genericTypes);

    try {
        const existingType = localReferenceTypeCache[refNameWithGenerics];
        if (existingType) {
            return existingType;
        }

        const referenceEnumType = getEnumerateType(type, true) as Tsoa.ReferenceType;
        if (referenceEnumType) {
            localReferenceTypeCache[refNameWithGenerics] = referenceEnumType;
            return referenceEnumType;
        }

        if (inProgressTypes[refNameWithGenerics]) {
            return createCircularDependencyResolver(refNameWithGenerics);
        }

        inProgressTypes[refNameWithGenerics] = true;

        const modelType = getModelTypeDeclaration(type);

        const referenceAliasType = getAliasType(modelType);
        if (referenceAliasType) {
            localReferenceTypeCache[refNameWithGenerics] = referenceAliasType;
            return referenceAliasType;
        }

        const properties = getModelProperties(modelType, genericTypes);
        const additionalProperties = getModelAdditionalProperties(modelType);
        const inheritedProperties = getModelInheritedProperties(modelType) || [];
        const example = getNodeExample(modelType);
        const additionalSwagger = getNodeSwagger(modelType);

        const referenceType = {
            additionalProperties,
            dataType: "refObject",
            description: getNodeDescription(modelType),
            properties: inheritedProperties,
            refName: refNameWithGenerics,
        } as Tsoa.ReferenceType;

        referenceType.properties = (referenceType.properties as Tsoa.Property[]).concat(properties);
        localReferenceTypeCache[refNameWithGenerics] = referenceType;

        if (example) {
            referenceType.example = example;
        }

        if (additionalSwagger) {
            referenceType.additionalSwagger = additionalSwagger;
        }

        return referenceType;
    } catch (err) {
        // tslint:disable-next-line:no-console;
        err.message = `There was a problem resolving type of '${getTypeName(typeName, genericTypes)}'.\n` + err.message;
        throw err;
    }
}

function resolveFqTypeName(type: ts.EntityName): string {
    if (type.kind === ts.SyntaxKind.Identifier) {
        return (type as ts.Identifier).text;
    }

    const qualifiedType = type as ts.QualifiedName;
    return resolveFqTypeName(qualifiedType.left) + "." + (qualifiedType.right as ts.Identifier).text;
}

function getTypeName(typeName: string, genericTypes?: ts.NodeArray<ts.TypeNode>): string {
    if (!genericTypes || !genericTypes.length) {
        return typeName;
    }
    return typeName + genericTypes.map((t) => getAnyTypeName(t)).join("");
}

function getAnyTypeName(typeNode: ts.TypeNode): string {
    const primitiveType = syntaxKindMap[typeNode.kind];
    if (primitiveType) {
        return primitiveType;
    }

    if (typeNode.kind === ts.SyntaxKind.ArrayType) {
        const arrayType = typeNode as ts.ArrayTypeNode;
        return getAnyTypeName(arrayType.elementType) + "Array";
    }

    if (typeNode.kind === ts.SyntaxKind.UnionType) {
        return "object";
    }

    if (typeNode.kind === ts.SyntaxKind.TypeLiteral) {
        return "object";
    }

    if (typeNode.kind !== ts.SyntaxKind.TypeReference) {
        throw new GenerateMetadataError(`Unknown type: ${ts.SyntaxKind[typeNode.kind]}.`);
    }

    const typeReference = typeNode as ts.TypeReferenceNode;
    try {
        return (typeReference.typeName as ts.Identifier).text;
    } catch (e) {
        // idk what would hit this? probably needs more testing
        // tslint:disable-next-line:no-console
        console.error(e);
        return typeNode.toString();
    }

}

function createCircularDependencyResolver(refName: string) {
    const referenceType = {
        dataType: "refObject",
        refName,
    } as Tsoa.ReferenceType | Tsoa.ReferenceAlias;

    MetadataGenerator.current.OnFinish((referenceTypes) => {
        const realReferenceType = referenceTypes[refName];
        if (!realReferenceType) {
            return;
        }
        referenceType.description = realReferenceType.description;
        referenceType.dataType = realReferenceType.dataType as any;
        referenceType.refName = referenceType.refName;

        if (referenceType.dataType === "refAlias" && realReferenceType.dataType === "refAlias") {
            referenceType.validators = realReferenceType.validators;
            referenceType.example = realReferenceType.example;
            referenceType.format = realReferenceType.format;
            referenceType.type = realReferenceType.type;
        } else {
            referenceType.properties = realReferenceType.properties;
        }
    });

    return referenceType;
}

function nodeIsUsable(node: ts.Node) {
    switch (node.kind) {
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
        case ts.SyntaxKind.EnumDeclaration:
            return true;
        default:
            return false;
    }
}

function resolveLeftmostIdentifier(type: ts.EntityName): ts.Identifier {
    while (type.kind !== ts.SyntaxKind.Identifier) {
        type = (type as ts.QualifiedName).left;
    }
    return type as ts.Identifier;
}

function resolveModelTypeScope(leftmost: ts.EntityName, statements: any): any[] {
    while (leftmost.parent && leftmost.parent.kind === ts.SyntaxKind.QualifiedName) {
        const leftmostName = leftmost.kind === ts.SyntaxKind.Identifier
            ? (leftmost as ts.Identifier).text
            : (leftmost as ts.QualifiedName).right.text;
        const moduleDeclarations = statements
            .filter((node: any) => {
                if (node.kind !== ts.SyntaxKind.ModuleDeclaration || !MetadataGenerator.current.IsExportedNode(node)) {
                    return false;
                }

                const moduleDeclaration = node as ts.ModuleDeclaration;
                return (moduleDeclaration.name as ts.Identifier).text.toLowerCase() === leftmostName.toLowerCase();
            }) as ts.ModuleDeclaration[];

        if (!moduleDeclarations.length) {
            throw new GenerateMetadataError(`No matching module declarations found for ${leftmostName}.`);
        }
        if (moduleDeclarations.length > 1) {
            throw new GenerateMetadataError(
                `Multiple matching module declarations found for ${leftmostName}; please make module declarations unique.`);
        }

        const moduleBlock = moduleDeclarations[0].body as ts.ModuleBlock;
        if (moduleBlock === null || moduleBlock.kind !== ts.SyntaxKind.ModuleBlock) {
            throw new GenerateMetadataError(`Module declaration found for ${leftmostName} has no body.`);
        }

        statements = moduleBlock.statements;
        leftmost = leftmost.parent as ts.EntityName;
    }

    return statements;
}

function getModelTypeDeclaration(type: ts.EntityName) {
    const leftmostIdentifier = resolveLeftmostIdentifier(type);
    const statements: any[] = resolveModelTypeScope(leftmostIdentifier, MetadataGenerator.current.nodes);

    const typeName = type.kind === ts.SyntaxKind.Identifier
        ? (type as ts.Identifier).text
        : (type as ts.QualifiedName).right.text;

    let modelTypes = statements
        .filter((node) => {
            if (!nodeIsUsable(node) || !MetadataGenerator.current.IsExportedNode(node)) {
                return false;
            }

            const modelTypeDeclaration = node;
            return (modelTypeDeclaration.name as ts.Identifier).text === typeName;
        }) as UsableDeclaration[];

    if (!modelTypes.length) {
        throw new GenerateMetadataError(`No matching model found for referenced type ${typeName}.`);
    }

    if (modelTypes.length > 1) {
        // remove types that are from typescript e.g. 'Account'
        modelTypes = modelTypes.filter((modelType) => {
            if (modelType.getSourceFile().fileName.replace(/\\/g, "/").toLowerCase().indexOf("node_modules/typescript") > -1) {
                return false;
            }

            return true;
        });

        /**
         * Model is marked with '@tsoaModel', indicating that it should be the 'canonical' model used
         */
        const designatedModels = modelTypes.filter((modelType) => {
            const isDesignatedModel = isExistJSDocTag(modelType, (tag) => tag.tagName.text === "tsoaModel");
            return isDesignatedModel;
        });

        if (designatedModels.length > 0) {
            if (designatedModels.length > 1) {
                throw new GenerateMetadataError(
                    `Multiple models for ${typeName} marked with '@tsoaModel'; '@tsoaModel' should only be applied to one model.`);
            }

            modelTypes = designatedModels;
        }
    }
    if (modelTypes.length > 1) {
        const conflicts = modelTypes.map((modelType) => modelType.getSourceFile().fileName).join('"; "');
        throw new GenerateMetadataError(
            `Multiple matching models found for referenced type ${typeName};
			 please make model names unique. Conflicts found: "${conflicts}".`);
    }

    return modelTypes[0];
}

function getModelProperties(node: UsableDeclaration, genericTypes?: ts.NodeArray<ts.TypeNode>): Tsoa.Property[] {
    const isIgnored = (e: ts.TypeElement | ts.ClassElement) => {
        const ignore = isExistJSDocTag(e, (tag) => tag.tagName.text === "ignore");
        return ignore;
    };

    // Interface model
    if (node.kind === ts.SyntaxKind.InterfaceDeclaration || node.kind === ts.SyntaxKind.TypeLiteral) {
        const interfaceDeclaration = node as ts.InterfaceDeclaration;
        return interfaceDeclaration.members
            .filter((member) => {
                const ignore = isIgnored(member);
                return !ignore && member.kind === ts.SyntaxKind.PropertySignature;
            })
            .map((member: any) => {
                const propertyDeclaration = member as ts.PropertyDeclaration;
                const identifier = propertyDeclaration.name as ts.Identifier;

                if (!propertyDeclaration.type) {
                    throw new GenerateMetadataError(`No valid type found for property declaration.`);
                }

                // Declare a variable that can be overridden if needed
                let aType = propertyDeclaration.type;

                // aType.kind will always be a TypeReference when the property of Interface<T> is of type T
                if (aType.kind === ts.SyntaxKind.TypeReference && genericTypes && genericTypes.length
                    && (node as ts.InterfaceDeclaration).typeParameters) {

                    // The type definitions are conviently located on the object which allow us to map -> to the genericTypes
                    const typeParams = map((node as ts.InterfaceDeclaration).typeParameters,
                        (typeParam: ts.TypeParameterDeclaration) => {
                            return typeParam.name.text;
                        });

                    // I am not sure in what cases
                    const typeIdentifier = (aType as ts.TypeReferenceNode).typeName;
                    let typeIdentifierName: string;

                    // typeIdentifier can either be a Identifier or a QualifiedName
                    if ((typeIdentifier as ts.Identifier).text) {
                        typeIdentifierName = (typeIdentifier as ts.Identifier).text;
                    } else {
                        typeIdentifierName = (typeIdentifier as ts.QualifiedName).right.text;
                    }

                    // I could not produce a situation where this did not find it so its possible this check is irrelevant
                    const indexOfType = indexOf(typeParams, typeIdentifierName);
                    if (indexOfType >= 0) {
                        aType = genericTypes[indexOfType] as ts.TypeNode;
                    }
                }

                // console.log(resolveType(aType, aType.parent));
                return {
                    description: getNodeDescription(propertyDeclaration),
                    format: getNodeFormat(propertyDeclaration),
                    example: getNodeExample(propertyDeclaration),
                    name: identifier.text,
                    required: !propertyDeclaration.questionToken,
                    type: resolveType(aType, aType.parent),
                    validators: getPropertyValidators(propertyDeclaration),
                } as Tsoa.Property;
            });
    }

    // Type alias model
    if (node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
        const aliasDeclaration = node as ts.TypeAliasDeclaration;
        /* tslint:disable-next-line */
        const properties: Tsoa.Property[] = [];

        if (aliasDeclaration.type.kind === ts.SyntaxKind.IntersectionType) {
            const intersectionTypeNode = aliasDeclaration.type as ts.IntersectionTypeNode;

            intersectionTypeNode.types.forEach((type) => {
                if (type.kind === ts.SyntaxKind.TypeReference) {
                    const typeReferenceNode = type as ts.TypeReferenceNode;
                    const modelType = getModelTypeDeclaration(typeReferenceNode.typeName);
                    const modelProps = getModelProperties(modelType);
                    properties.push(...modelProps);
                }
            });
        }

        if (aliasDeclaration.type.kind === ts.SyntaxKind.TypeReference) {
            const typeReferenceNode = aliasDeclaration.type as ts.TypeReferenceNode;
            const modelType = getModelTypeDeclaration(typeReferenceNode.typeName);
            const modelProps = getModelProperties(modelType);
            properties.push(...modelProps);
        }
        return properties;
    }

    // Class model
    const classDeclaration = node as ts.ClassDeclaration;

    const properties = classDeclaration.members
        .filter((member) => {
            if (member.kind === ts.SyntaxKind.MethodDeclaration) {
                throw new GenerateMetadataError(`Illegal method declaration on model class`);
            } else {
                return true;
            }
        })
        .filter((member) => {
            const ignore = isIgnored(member);
            return !ignore;
        })
        .filter((member) => member.kind === ts.SyntaxKind.PropertyDeclaration)
        .filter((member) => hasPublicModifier(member)) as Array<ts.PropertyDeclaration | ts.ParameterDeclaration>;

    const classConstructor = classDeclaration
        .members
        .find((member) => member.kind === ts.SyntaxKind.Constructor) as ts.ConstructorDeclaration;

    if (classConstructor && classConstructor.parameters) {
        const constructorProperties = classConstructor.parameters
            .filter((parameter) => hasPublicModifier(parameter));

        properties.push(...constructorProperties);
    }

    return properties
        .map((property) => {
            const identifier = property.name as ts.Identifier;
            let typeNode = property.type;

            if (!typeNode) {
                const tsType = MetadataGenerator.current.typeChecker.getTypeAtLocation(property);
                typeNode = MetadataGenerator.current.typeChecker.typeToTypeNode(tsType);
            }

            if (!typeNode) {
                throw new GenerateMetadataError(`No valid type found for property declaration.`);
            }

            if (typeNode.kind === ts.SyntaxKind.TypeReference && genericTypes && genericTypes.length
                && (node as ts.ClassDeclaration).typeParameters) {

                // The type definitions are conviently located on the object which allow us to map -> to the genericTypes
                const typeParams = map((node as ts.ClassDeclaration).typeParameters,
                    (typeParam: ts.TypeParameterDeclaration) => {
                        return typeParam.name.text;
                    });

                // I am not sure in what cases
                const typeIdentifier = (typeNode as ts.TypeReferenceNode).typeName;
                let typeIdentifierName: string;

                // typeIdentifier can either be a Identifier or a QualifiedName
                if ((typeIdentifier as ts.Identifier).text) {
                    typeIdentifierName = (typeIdentifier as ts.Identifier).text;
                } else {
                    typeIdentifierName = (typeIdentifier as ts.QualifiedName).right.text;
                }

                // I could not produce a situation where this did not find it so its possible this check is irrelevant
                const indexOfType = indexOf(typeParams, typeIdentifierName);
                if (indexOfType >= 0) {
                    typeNode = genericTypes[indexOfType] as ts.TypeNode;
                }
            }

            const type = resolveType(typeNode, property);

            // console.log(type);
            return {
                default: getInitializerValue(property.initializer, type),
                description: getNodeDescription(property),
                format: getNodeFormat(property),
                example: getNodeExample(property),
                name: identifier.text,
                required: !property.questionToken && !property.initializer,
                type,
                validators: getPropertyValidators(property as ts.PropertyDeclaration),
            } as Tsoa.Property;
        });
}

function getModelAdditionalProperties(node: UsableDeclaration) {
    if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
        const interfaceDeclaration = node as ts.InterfaceDeclaration;
        const indexMember = interfaceDeclaration
            .members
            .find((member) => member.kind === ts.SyntaxKind.IndexSignature);
        if (!indexMember) {
            return undefined;
        }

        const indexSignatureDeclaration = indexMember as ts.IndexSignatureDeclaration;
        const indexType = resolveType(indexSignatureDeclaration.parameters[0].type as ts.TypeNode);
        if (indexType.dataType !== "string") {
            throw new GenerateMetadataError(`Only string indexers are supported.`);
        }

        return resolveType(indexSignatureDeclaration.type as ts.TypeNode);
    }

    return undefined;
}

function getModelInheritedProperties(modelTypeDeclaration: UsableDeclaration): Tsoa.Property[] {
    const properties = [] as Tsoa.Property[];
    if (modelTypeDeclaration.kind === ts.SyntaxKind.TypeAliasDeclaration) {
        return [];
    }
    if (modelTypeDeclaration.kind === ts.SyntaxKind.TypeLiteral) {
        return [];
    }
    const heritageClauses = modelTypeDeclaration.heritageClauses;
    if (!heritageClauses) {
        return properties;
    }

    heritageClauses.forEach((clause) => {
        if (!clause.types) {
            return;
        }

        clause.types.forEach((t) => {
            const baseEntityName = t.expression as ts.EntityName;
            const referenceType = getReferenceType(baseEntityName);
            if (referenceType.properties) {
                referenceType.properties.forEach((property) => properties.push(property));
            }
        });
    });

    return properties;
}

function hasPublicModifier(node: ts.Node) {
    return !node.modifiers || node.modifiers.every((modifier) => {
        return modifier.kind !== ts.SyntaxKind.ProtectedKeyword && modifier.kind !== ts.SyntaxKind.PrivateKeyword;
    });
}

function getNodeDescription(node: UsableDeclaration | ts.PropertyDeclaration |
    ts.ParameterDeclaration | ts.EnumDeclaration) {
    if (node.kind === ts.SyntaxKind.TypeLiteral) {
        return undefined;
    }
    const symbol = MetadataGenerator.current.typeChecker.getSymbolAtLocation(node.name as ts.Node);
    if (!symbol) {
        return undefined;
    }

    /**
     * TODO: Workaround for what seems like a bug in the compiler
     * Warrants more investigation and possibly a PR against typescript
     */
    if (node.kind === ts.SyntaxKind.Parameter) {
        // TypeScript won't parse jsdoc if the flag is 4, i.e. 'Property'
        symbol.flags = 0;
    }

    try {
        const comments = symbol.getDocumentationComment(undefined);
        if (comments.length) {
            return ts.displayPartsToString(comments);
        }
        return undefined;
    } catch (e) {
        return undefined;
    }
}

function getNodeFormat(node: UsableDeclaration | ts.PropertyDeclaration |
    ts.ParameterDeclaration | ts.EnumDeclaration) {
    return getJSDocComment(node, "format");
}
