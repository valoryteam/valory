import * as ts from "typescript";
import { Tsoa } from "./tsoa";
export declare class MethodGenerator {
    private readonly node;
    private readonly parentTags?;
    private readonly parentSecurity?;
    private method;
    private path;
    constructor(node: ts.MethodDeclaration, parentTags?: string[], parentSecurity?: Tsoa.Security[]);
    IsValid(): boolean;
    Generate(): Tsoa.Method;
    private buildParameters;
    private getCurrentLocation;
    private processMethodDecorators;
    private getMethodResponses;
    private getMethodSuccessResponse;
    private getMethodSuccessExamples;
    private supportsPathMethod;
    private getExamplesValue;
    private getTags;
    private getIsHidden;
    private getSecurity;
}
