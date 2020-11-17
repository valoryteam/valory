import {Tsoa} from "@tsoa/runtime";
import Metadata = Tsoa.Metadata;
import {OpenAPIV3} from "openapi-types";
import Controller = Tsoa.Controller;
import {Config} from "../../lib/config";
import {relative, join, parse} from "path";
import Method = Tsoa.Method;
import {ROUTES_VERSION, uppercaseHttpMethod} from "../../lib/common/headers";
import Parameter = Tsoa.Parameter;
import {Logger} from "pino";
import {CORSData, generateCORSData} from "./cors-data-generator";

const ROUTE_MODULE_HEADER = `
// @ts-nocheck
/* tslint:disable */

function generateCORSResponse(allowedHeaders, allowedMethods) {
    return {
        headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Headers": allowedHeaders,
            "Access-Control-Allow-Methods": allowedMethods,
        },
        statusCode: 200
    }
}

const name = "PrimaryHandler";
`;

const REGISTER_ENDPOINT = `
function registerEndpoint(app, path, method, controller, qualifiedMethod, boundHandler) {
    app.endpoint(path, method)
        .aML(controller.middleware)
        .aML(qualifiedMethod.middleware)
        .aM({
            name,
            filter: {mustExclude: handlerEscapeKeys},
            async handler(ctx) {
                controller.ctx = ctx;
                controller.logger = ctx.attachments.getAttachment(Endpoint.HandlerLoggerKey);
                controller.headers = ctx.response.headers || {};
                
                const response = await boundHandler(ctx);
                ctx.response.body = response;
                ctx.response.statusCode = qualifiedMethod.statusCode || 200;
                if (controller.statusSet) {
                    ctx.response.statusCode = controller.getStatus();                        
                }
                ctx.response.headers = controller.getHeaders();
                controller.clearStatus();
                controller.clearHeaders();
            }
        })
        .aML(qualifiedMethod.postMiddleware)
        .aML(controller.postMiddleware)
        .done();
}
`;

export class RouteModule {
    private logger: Logger;

    constructor(
        private readonly metadata: Metadata,
        private readonly spec: OpenAPIV3.Document,
        private readonly outputDirectory: string,
        private readonly allowedHeaders: string[],
    ) {
        this.logger = Config.Logger.child({class: RouteModule.name, outputDirectory: this.outputDirectory});
    }

    public generate() {
        const imports = this.metadata.controllers.map(this.generateControllerImport.bind(this));
        const instantiators = this.metadata.controllers.map(this.generateControllerInstantiators.bind(this));
        const routes = this.metadata.controllers.flatMap(this.generateController.bind(this));
        const cors = generateCORSData(this.spec, this.allowedHeaders).map(this.generateCORSHandler.bind(this));
        // const extensionChecks = this.metadata.controllers.flatMap(this.generateExtensionCheck.bind(this));

        return `
        ${ROUTE_MODULE_HEADER}
        ${this.generateValoryRuntimeImport()}
        ${imports.join("\n")}
        ${instantiators.join("\n")}
        ${REGISTER_ENDPOINT}
        
        module.exports = {
            routesVersion: ${ROUTES_VERSION},
            register(app) {
                ${routes.join("\n")}
                ${cors.join("\n")}
            }
        };
        `;
    }

    private generateCORSHandler(corsData: CORSData) {
        return `
        app.endpoint("${corsData.path}", "OPTIONS")
            .aM({
                name: "CORSHandler",
                handler(ctx) {
                    ctx.response = generateCORSResponse("${corsData.allowedHeaders.join(",")}","${corsData.allowedMethods.join(",")}");
                }
            }).done();
        `;
    }

    private generateValoryRuntimeImport() {
        return `import {Endpoint, RequestValidator} from "${this.resolveValoryRuntime()}";
        const handlerEscapeKeys = [RequestValidator.ValidationErrorsKey, Endpoint.ExceptionKey];`;
    }

    private generateControllerImport(controller: Controller) {
        const {dir, name} = parse(controller.location);
        const controllerLocation = join(dir, name);
        this.logger.debug({controllerLocation}, "Resolving controller path");
        return `import {${controller.name}} from "./${relative(this.outputDirectory, controllerLocation)}";`;
    }

    private generateControllerInstantiators(controller: Controller) {
        return `const ${this.getControllerName(controller.name)} = new ${controller.name}();`;
    }

    private getControllerName(name: string) {
        return `${name}Controller`;
    }

    private generateController(controller: Controller) {
        return controller.methods.map(method => this.generateOperation(controller, method));
    }

    private resolveValoryRuntime() {
        return process.env.NODE_ENV === "test" ? relative(this.outputDirectory, join(Config.RootPath, "src/main")) : "valory-runtime";
    }

    private resolveMethodPath(controllerPath: string, methodPath: string) {
        const path = (`/${controllerPath}/${methodPath}`).replace(/\/\//, "/");
        return (path.endsWith("/") && path.length > 1) ? path.substring(0, path.length - 1) : path;
    }

    private generateOperation(controller: Controller, method: Method) {
        const path = this.resolveMethodPath(controller.path, method.path);
        const controllerName = this.getControllerName(controller.name);
        const qualifiedMethod = `${controllerName}.${method.name}`;
        return `
        registerEndpoint(app, "${path}", "${uppercaseHttpMethod(method.method)}", ${controllerName}, ${qualifiedMethod},
            (ctx) => ${qualifiedMethod}(
                ${method.parameters.map(this.generateParameter).join(",")}
            ));
        `;
    }

    private generateParameter(param: Parameter) {
        switch (param.in) {
            case "body":
                return "ctx.request.body";
            case "request":
                return "(ctx as any)";
            case "body-prop":
                return `ctx.request.body["${param.name}"]`;
            case "formData":
                return `ctx.request.formData`;
            case "query":
                return `ctx.request.queryParams["${param.name}"]`;
            case "header":
                return `ctx.request.headers["${param.name}"]`;
            case "path":
                return `ctx.request.pathParams["${param.name}"]`;
        }
    }
}
