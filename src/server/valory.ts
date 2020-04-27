import {Logger} from "pino";
import {ApiAdaptor, HttpMethod, VALORY_DEFAULT_ADAPTOR_VAR} from "../lib/common/headers";
import {Endpoint} from "./endpoint";
import {RoutesModule, ValoryGlobalData} from "../lib/common/compiler-headers";
import P = require("pino");
import {loadGlobalData} from "../lib/global-data-load";
import {ApiMiddleware} from "../main";

export interface ValoryArgs {
    beforeAllMiddleware?: ApiMiddleware[];
    afterAllMiddleware?: ApiMiddleware[];
    adaptor: ApiAdaptor;
    baseLogger?: Logger;
}

export class Valory {
    private static instance: Valory;
    private static directInstantiation = true;
    public readonly adaptor: ApiAdaptor;
    public readonly logger: Logger;

    /** @internal */ public readonly beforeAllMiddleware: ApiMiddleware[];
    /** @internal */ public readonly afterAllMiddleware: ApiMiddleware[];
    /** @internal */ public readonly globalData?: ValoryGlobalData;

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

        const {adaptor, baseLogger, afterAllMiddleware, beforeAllMiddleware} = args;

        this.adaptor = Valory.resolveAdaptor(adaptor);
        this.afterAllMiddleware = afterAllMiddleware;
        this.beforeAllMiddleware = beforeAllMiddleware;
        this.logger = baseLogger || P();

        this.logger.info("Starting Valory");

        this.globalData = loadGlobalData();
        this.registerGeneratedRoutes(this.globalData.routes);
    }

    private static resolveAdaptor(provided: ApiAdaptor): ApiAdaptor {
        const defaultAdaptorPath = process.env[VALORY_DEFAULT_ADAPTOR_VAR];
        if (defaultAdaptorPath == null) {return provided;}
        const defaultAdaptor = require(defaultAdaptorPath).DefaultAdaptor;
        return new defaultAdaptor(8080);
    }

    private endpoint(path: string, method: HttpMethod) {
        return new Endpoint(this, path, method);
    }

    public start() {
        this.logger.info("Startup Complete");
        return this.adaptor.start();
    }

    public shutdown() {
        return this.adaptor.shutdown();
    }

    public registerGeneratedRoutes(routes: RoutesModule) {
        routes.register(this);
    }
}
