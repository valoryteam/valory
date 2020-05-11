import {Tsoa} from "tsoa/dist/metadataGeneration/tsoa";
import Metadata = Tsoa.Metadata;
import {OpenAPIV3} from "openapi-types";
import Controller = Tsoa.Controller;
import {Config} from "../../lib/config";
import {relative, join, parse} from "path";
import Method = Tsoa.Method;
import {ROUTES_VERSION, uppercaseHttpMethod} from "../../lib/common/headers";
import Parameter = Tsoa.Parameter;
import {Logger} from "pino";

const ROUTE_MODULE_HEADER = `
// @ts-nocheck
/* tslint:disable */

function isController(object) {
    return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object
}

const name = "PrimaryHandler";
`;

export class RouteModule {
    private logger: Logger;

    constructor(
        private readonly metadata: Metadata,
        private readonly spec: OpenAPIV3.Document,
        private readonly outputDirectory: string
    ) {
        this.logger = Config.Logger.child({class: RouteModule.name, outputDirectory: this.outputDirectory});
    }

    public generate() {
        const imports = this.metadata.controllers.map(this.generateControllerImport.bind(this));
        const instantiators = this.metadata.controllers.map(this.generateControllerInstantiators.bind(this));
        const routes = this.metadata.controllers.flatMap(this.generateController.bind(this));
        const extensionChecks = this.metadata.controllers.flatMap(this.generateExtensionCheck.bind(this));

        return `
        ${ROUTE_MODULE_HEADER}
        ${this.generateValoryRuntimeImport()}
        ${imports.join("\n")}
        ${instantiators.join("\n")}
        ${extensionChecks.join("\n")}
        
        module.exports = {
            routesVersion: ${ROUTES_VERSION},
            register(app) {
                ${routes.join("\n")}
            }
        };
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

    private generateExtensionCheck(controller: Controller) {
        return `const ${this.getControllerExtensionCheckName(controller.name)} = isController(${this.getControllerName(controller.name)});`;
    }

    private getControllerName(name: string) {
        return `${name}Controller`;
    }

    private getControllerExtensionCheckName(name: string) {
        return `${this.getControllerName(name)}ExtendsController`;
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
        app.endpoint("${path}","${uppercaseHttpMethod(method.method)}")
            .aML(${controllerName}.middleware)
            .aML(${qualifiedMethod}.middleware)
            .aM({
                name,
                async handler(ctx) {
                    if (ctx.attachments.hasAnyAttachments(handlerEscapeKeys)) {
                        return;
                    }
                    if (${this.getControllerExtensionCheckName(controller.name)}) {
                        ${controllerName}.ctx = ctx;
                        ${controllerName}.logger = ctx.attachments.getAttachment(Endpoint.HandlerLoggerKey);
                        ${controllerName}.headers = ctx.response.headers || {};
                    }
                    
                    const response = await ${controllerName}.${method.name}(
                        ${method.parameters.map(this.generateParameter).join(",")}
                    );
                    ctx.response.body = response;
                    ctx.response.statusCode = ${qualifiedMethod}.statusCode || 200;
                    if (${this.getControllerExtensionCheckName(controller.name)}) {
                        if (${controllerName}.statusSet) {
                            ctx.response.statusCode = ${controllerName}.getStatus();                        
                        }
                        ctx.response.headers = ${controllerName}.getHeaders();
                        ${controllerName}.clearStatus();
                        ${controllerName}.clearHeaders();
                    }
                }
            })
            .aML(${controllerName}.${method.name}.postMiddleware)
            .aML(${controllerName}.postMiddleware)
            .done();
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
