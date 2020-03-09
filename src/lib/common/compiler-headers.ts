import {ValidateFunction} from "ajv";
import {OpenAPIV3} from "openapi-types";



export interface ValidatorModule {
    validators: {[path: string]: {[method: string]: {[status: string]: ValidateFunction}}};
    spec: OpenAPIV3.Document;
    specHash: string;
    compswagVersion: number;
}
