import { Tsoa } from "./metadataGeneration/tsoa";
import { Swagger } from "../server/swagger";
export declare class SpecGenerator {
    private readonly metadata;
    constructor(metadata: Tsoa.Metadata);
    GetSpec(): Swagger.Spec;
    private buildDefinitions;
    private buildPaths;
    private buildMethod;
    private buildBodyPropParameter;
    private buildParameter;
    private buildLiteralObject;
    private buildProperties;
    private buildAdditionalProperties;
    private buildOperation;
    private getOperationId;
    private getSwaggerType;
    private getSwaggerTypeForPrimitiveType;
    private getSwaggerTypeForArrayType;
    private getSwaggerTypeForEnumType;
    private getSwaggerTypeForReferenceType;
}
