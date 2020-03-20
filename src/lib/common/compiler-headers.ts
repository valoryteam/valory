import {OpenAPIV3} from "openapi-types";

export namespace AJVTypes {
    export type ErrorParameters = RefParams | LimitParams | AdditionalPropertiesParams |
        DependenciesParams | FormatParams | ComparisonParams |
        MultipleOfParams | PatternParams | RequiredParams |
        TypeParams | UniqueItemsParams | CustomParams |
        PatternRequiredParams | PropertyNamesParams |
        IfParams | SwitchParams | NoParams | EnumParams;

    interface RefParams {
        ref: string;
    }

    interface LimitParams {
        limit: number;
    }

    interface AdditionalPropertiesParams {
        additionalProperty: string;
    }

    interface DependenciesParams {
        property: string;
        missingProperty: string;
        depsCount: number;
        deps: string;
    }

    interface FormatParams {
        format: string
    }

    interface ComparisonParams {
        comparison: string;
        limit: number | string;
        exclusive: boolean;
    }

    interface MultipleOfParams {
        multipleOf: number;
    }

    interface PatternParams {
        pattern: string;
    }

    interface RequiredParams {
        missingProperty: string;
    }

    interface TypeParams {
        type: string;
    }

    interface UniqueItemsParams {
        i: number;
        j: number;
    }

    interface CustomParams {
        keyword: string;
    }

    interface PatternRequiredParams {
        missingPattern: string;
    }

    interface PropertyNamesParams {
        propertyName: string;
    }

    interface IfParams {
        failingKeyword: string;
    }

    interface SwitchParams {
        caseIndex: number;
    }

    // tslint:disable-next-line:no-empty-interface
    interface NoParams { }

    interface EnumParams {
        allowedValues: any[];
    }

    export interface ErrorObject {
        keyword: string;
        dataPath: string;
        schemaPath: string;
        params: ErrorParameters;
        // Added to validation errors of propertyNames keyword schema
        propertyName?: string;
        // Excluded if messages set to false.
        message?: string;
        // These are added with the `verbose` option.
        schema?: any;
        parentSchema?: object;
        data?: any;
    }

    export interface ValidateFunction {
        (
            data: any,
            dataPath?: string,
            parentData?: object | any[],
            parentDataProperty?: string | number,
            rootData?: object | any[]
        ): boolean | PromiseLike<any>;
        schema?: object | boolean;
        errors?: null | ErrorObject[];
        refs?: object;
        refVal?: any[];
        root?: ValidateFunction | object;
        $async?: true;
        source?: object;
    }
}

export interface ValidatorModule {
    validators: {[path: string]: {[method: string]: {[status: string]: AJVTypes.ValidateFunction}}};
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
