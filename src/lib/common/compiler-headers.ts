import {ValidateFunction} from "ajv";
import {OpenAPIV3} from "openapi-types";
import {Valory} from "../../server/valory";



export interface ValidatorModule {
    validators: {[path: string]: {[method: string]: {[status: string]: ValidateFunction}}};
    spec: OpenAPIV3.Document;
    specHash: string;
    compswagVersion: number;
}

export interface RoutesModule {
    register: (app: Valory) => void
    components: OpenAPIV3.ComponentsObject;
    routesVersion: number;
}
