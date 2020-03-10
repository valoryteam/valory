import {ValidateFunction} from "ajv";
import {OpenAPIV3} from "openapi-types";

export interface ValidatorModule {
    validators: {[path: string]: {[method: string]: {[status: string]: ValidateFunction}}};
    spec: OpenAPIV3.Document;
    specHash: string;
    compswagVersion: number;
}

export interface RoutesModule {
    register: (app: any) => void
    components: OpenAPIV3.ComponentsObject;
    routesVersion: number;
}

export interface ValoryGlobalData {
    validation: ValidatorModule;
    routes: RoutesModule;
}

export const GLOBAL_ENTRY_KEY = "VALORY_DATA";
