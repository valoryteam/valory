import * as ts from "typescript";
import { Tsoa } from "./tsoa";
export declare class ParameterGenerator {
    private readonly parameter;
    private readonly method;
    private readonly path;
    constructor(parameter: ts.ParameterDeclaration, method: string, path: string);
    Generate(): Tsoa.Parameter;
    private getRequestParameter;
    private getLoggerParameter;
    private getBodyPropParameter;
    private getBodyParameter;
    private getHeaderParameter;
    private getQueryParameter;
    private getPathParameter;
    private getParameterDescription;
    private supportBodyMethod;
    private supportParameterDecorator;
    private supportPathDataType;
    private getValidatedType;
}
