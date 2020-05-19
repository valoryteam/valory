import {AttachmentRegistry} from "../../lib/common/attachment-registry";
import {AJVTypes} from "../../lib/common/compiler-headers";
import {ApiContext} from "../../lib/common/context";
import {loadGlobalData} from "../../lib/global-data-load";
import {ApiMiddleware} from "../../lib/common/headers";

export class ResponseValidator implements ApiMiddleware {
    public static ResponseValidationErrorsKey = AttachmentRegistry.createKey<string[]>();

    public readonly name = "ResponseValidator";
    private readonly validatorMap: {[path: string]: {[method: string]: {[status: number]: AJVTypes.ValidateFunction}}};

    constructor() {
        this.validatorMap = loadGlobalData().validation.validators;
    }

    public handler(ctx: ApiContext) {
        const validator = this.validatorMap[ctx.request.path]?.[ctx.request.method]?.[ctx.response.statusCode || 200];
        const result = validator?.(ctx.response);

        if (validator && result !== true) {
            ctx.attachments.putAttachment(ResponseValidator.ResponseValidationErrorsKey, validator.errors);
        }
    }
}
