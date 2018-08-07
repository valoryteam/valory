import * as ts from "typescript";
import { Tsoa } from "./tsoa";
export declare class MetadataGenerator {
    private readonly ignorePaths?;
    static current: MetadataGenerator;
    readonly nodes: ts.Node[];
    readonly typeChecker: ts.TypeChecker;
    private readonly program;
    private referenceTypeMap;
    private circularDependencyResolvers;
    constructor(entryFile: string, compilerOptions?: ts.CompilerOptions, ignorePaths?: string[]);
    IsExportedNode(node: ts.Node): boolean;
    Generate(): Tsoa.Metadata;
    TypeChecker(): ts.TypeChecker;
    AddReferenceType(referenceType: Tsoa.ReferenceType | Tsoa.ReferenceAlias): void;
    GetReferenceType(refName: string): Tsoa.ReferenceAlias | Tsoa.ReferenceType;
    OnFinish(callback: (referenceTypes: Tsoa.ReferenceTypeMap) => void): void;
    private buildControllers;
}
