import { Swagger } from "../../server/swagger";
export declare namespace Tsoa {
    interface Metadata {
        controllers: Controller[];
        referenceTypeMap: ReferenceTypeMap;
    }
    interface Controller {
        location: string;
        methods: Method[];
        name: string;
        path: string;
        extendsController: boolean;
    }
    interface Method {
        deprecated?: boolean;
        description?: string;
        method: "get" | "post" | "put" | "delete" | "options" | "head" | "patch";
        name: string;
        parameters: Parameter[];
        path: string;
        type: Type;
        tags?: string[];
        responses: Response[];
        security: Security[];
        summary?: string;
        isHidden: boolean;
    }
    interface Parameter {
        parameterName: string;
        description?: string;
        in: "query" | "header" | "path" | "formData" | "body" | "body-prop" | "request" | "logger";
        name: string;
        required?: boolean;
        type: Type;
        default?: any;
        validators: Validators;
    }
    interface Validators {
        [key: string]: {
            value?: any;
            errorMsg?: string;
        };
    }
    interface Security {
        name: string;
        scopes?: string[];
    }
    interface Response {
        description: string;
        name: string;
        schema?: Type;
        examples?: any;
    }
    interface Property {
        default?: any;
        description?: string;
        format?: string;
        name: string;
        type: Type;
        required: boolean;
        validators: Validators;
    }
    interface Type {
        dataType: "string" | "double" | "float" | "integer" | "long" | "enum" | "array" | "datetime" | "date" | "buffer" | "void" | "object" | "any" | "refEnum" | "refObject" | "refAlias";
    }
    interface EnumerateType extends Type {
        dataType: "enum";
        enums: string[];
    }
    interface ObjectType extends Type {
        dataType: "object";
        example?: any;
        description?: string;
        properties?: Property[];
        additionalProperties?: Type;
    }
    interface ArrayType extends Type {
        dataType: "array";
        elementType: Type;
    }
    interface ReferenceAlias extends Type {
        description?: string;
        dataType: "refAlias";
        refName: string;
        example?: any;
        additionalSwagger?: Swagger.Schema;
        validators: Validators;
        type: Type;
        format?: string;
        properties?: Property[];
        additionalProperties?: Type;
    }
    interface ReferenceType extends Type {
        description?: string;
        dataType: "refObject" | "refEnum";
        refName: string;
        properties?: Property[];
        additionalProperties?: Type;
        enums?: string[];
        example?: any;
        additionalSwagger?: Swagger.Schema;
    }
    interface ReferenceTypeMap {
        [refName: string]: Tsoa.ReferenceType | Tsoa.ReferenceAlias;
    }
}
