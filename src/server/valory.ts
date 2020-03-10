import {OpenAPIV3} from "openapi-types";
import {ApiAdaptor} from "../lib/common/adaptor";
import {Logger} from "pino";
import {Config, METADATA_VERSION} from "../lib/config";
import {HttpMethod} from "../lib/common/headers";
import {Endpoint} from "./endpoint";
import {RoutesModule, ValoryGlobalData} from "../lib/common/compiler-headers";
import P = require("pino");
import {loadGlobalData} from "../lib/global-data-load";

export interface ValoryArgs {
    openapi: {
        info: OpenAPIV3.InfoObject;
        servers?: OpenAPIV3.ServerObject[];
        components?: OpenAPIV3.ComponentsObject;
        security?: OpenAPIV3.SecurityRequirementObject[];
        tags?: OpenAPIV3.TagObject[];
        externalDocs?: OpenAPIV3.ExternalDocumentationObject;
    };
    adaptor: ApiAdaptor;
    baseLogger?: Logger;
}

export class Valory {
    private static instance: Valory;
    private static directInstantiation = true;
    public readonly adaptor: ApiAdaptor;
    public readonly apiDef: OpenAPIV3.Document;
    public readonly logger: Logger;
    /**
     * @hidden
     */
    public readonly globalData?: ValoryGlobalData;

    public static createInstance(args: ValoryArgs) {
        Valory.directInstantiation = false;
        return new Valory(args);
    }

    public static getInstance() {
        if (Valory.instance == null) {throw new Error("Valory instance has not yet been created");}
        return Valory.instance;
    }

    private constructor(args: ValoryArgs) {
        if (Valory.instance != null) {
            throw new Error("Valory instance has already been created");
        }
        if (Valory.directInstantiation) {
            throw new Error("Valory should not be directly instantiated");
        }
        Valory.instance = this;

        const {adaptor, openapi, baseLogger} = args;

        this.adaptor = this.resolveAdaptor(adaptor);
        this.logger = baseLogger || P();

        this.apiDef = {
            ...openapi,
            paths: {},
            openapi: "3.0.2",
        };

        Config.load(false);

        if (!Config.CompileMode) this.logger.info("Starting Valory");

        this.globalData = loadGlobalData();
        this.registerGeneratedRoutes(this.globalData.routes)
    }

    private resolveAdaptor(provided: ApiAdaptor): ApiAdaptor {
        const defaultAdaptorPath = Config.getDefaultAdaptorPath();
        if (defaultAdaptorPath == null) {return provided}
        const defaultAdaptor = require(defaultAdaptorPath).DefaultAdaptor;
        return new defaultAdaptor();
    }

    public endpoint(path: string, method: HttpMethod, operation: OpenAPIV3.OperationObject) {
        return new Endpoint(this, path, method, operation);
    }

    public start() {
        if (Config.CompileMode) {
            this.exportMetadata();
        } else {
            this.logger.info("Startup Complete");
            return this.adaptor.start()
        }
    }

    public shutdown() {
        return this.adaptor.shutdown()
    }

    public registerGeneratedRoutes(routes: RoutesModule) {
        routes.register(this);
        this.apiDef.components = Object.assign(this.apiDef.components || {}, routes.components)
    }

    private exportMetadata() {
        Config.setMetadata({
            openapi: this.apiDef,
            version: METADATA_VERSION
        })
    }
}
