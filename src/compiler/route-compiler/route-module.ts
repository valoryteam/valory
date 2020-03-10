import {Tsoa} from "tsoa/dist/metadataGeneration/tsoa";
import Metadata = Tsoa.Metadata;
import {OpenAPIV3} from "openapi-types";
import Controller = Tsoa.Controller;
import {Config, ROUTES_VERSION} from "../../lib/config";
import {relative, join} from "path";
import Method = Tsoa.Method;
import {uppercaseHttpMethod} from "../../lib/common/headers";
import Parameter = Tsoa.Parameter;

const ROUTE_MODULE_HEADER = `
// @ts-nocheck
/* tslint:disable */

function isController(object) {
    return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object
}

`;

export class RouteModule {
    constructor(
        private readonly metadata: Metadata,
        private readonly spec: OpenAPIV3.Document,
        private readonly outputDirectory: string
    ) {}

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
            components: ${JSON.stringify(this.spec.components)},
            register(app) {
                ${routes.join("\n")}
            }
        };
        `;
    }

    private generateValoryRuntimeImport() {
        return `import {Endpoint, RequestValidator} from "${this.resolveValoryRuntime()}";`;
    }

    private generateControllerImport(controller: Controller) {
        return `import {${controller.name}} from "./${relative(this.outputDirectory, controller.location.split(".")[0])}";`;
    }

    private generateControllerInstantiators(controller: Controller) {
        return `const ${this.getControllerName(controller.name)} = new ${controller.name}();`;
    }

    private generateExtensionCheck(controller: Controller) {
        return `const ${this.getControllerExtensionCheckName(controller.name)} = isController(${this.getControllerName(controller.name)});`;
    }

    private getControllerName(name: string) {
        return `${name}Controller`
    }

    private getControllerExtensionCheckName(name: string) {
        return `${this.getControllerName(name)}ExtendsController`;
    }

    private generateController(controller: Controller) {
        return controller.methods.map(method => this.generateOperation(controller, method))
    }

    private resolveValoryRuntime() {
        return process.env.NODE_ENV === "test" ? relative(this.outputDirectory, join(Config.RootPath, "src/main")) : "valory-runtime"
    }

    private generateOperation(controller: Controller, method: Method) {
        const path = (`/${controller.path}/${method.path}`).replace(/\/\//, "/");
        return `
        app.endpoint("${path}","${uppercaseHttpMethod(method.method)}",${JSON.stringify(this.spec.paths[path][method.method])})
            .appendMiddlewareList(${this.getControllerName(controller.name)}.middleware)
            .appendMiddlewareList(${this.getControllerName(controller.name)}.${method.name}.middleware)
            .appendMiddleware({
                name: "PrimaryHandler",
                async handler(ctx) {
                    if (ctx.attachments.hasAttachment(RequestValidator.ValidationErrorsKey) || ctx.attachments.hasAttachment(Endpoint.ExceptionKey)) {
                        return;
                    }
                    if (${this.getControllerExtensionCheckName(controller.name)}) {
                        ${this.getControllerName(controller.name)}.logger = ctx.attachments.getAttachment(Endpoint.HandlerLoggerKey);
                        ${this.getControllerName(controller.name)}.headers = ctx.response.headers || {};
                    }
                    
                    const response = await ${this.getControllerName(controller.name)}.${method.name}(
                        ${method.parameters.map(this.generateParameter).join(",")}
                    );
                    ctx.response.body = response;
                    if (${this.getControllerExtensionCheckName(controller.name)}) {
                        ctx.response.statusCode = ${this.getControllerName(controller.name)}.getStatus();
                        ctx.response.headers = ${this.getControllerName(controller.name)}.getHeaders();
                        ${this.getControllerName(controller.name)}.clearStatus();
                        ${this.getControllerName(controller.name)}.clearHeaders();
                    }
                }
            })
            .appendMiddlewareList(${this.getControllerName(controller.name)}.${method.name}.postMiddleware)
            .appendMiddlewareList(${this.getControllerName(controller.name)}.postMiddleware)
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
                return `ctx.request.pathParams["${param.name}"]`
        }
    }
}
