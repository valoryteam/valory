import {ApiMiddleware, HttpMethod} from "../../lib/common/headers";
import {Valory} from "../valory";
import {ApiContext} from "../../lib/common/context";
import {AttachmentRegistry} from "../../lib/common/attachment-registry";
import {AJVTypes} from "../../lib/common/compiler-headers";

// tslint:disable-next-line:no-empty
const NOOP = () => {};

export class RequestValidator implements ApiMiddleware {
    public static ValidationErrorsKey = AttachmentRegistry.createKey<string[]>();

    public readonly name = "RequestValidator";
    private readonly validator: AJVTypes.ValidateFunction;

    constructor(valory: Valory, path: string, method: HttpMethod) {
        this.validator = (method !== "OPTIONS") ? valory.globalData.validation.validators[path][method]["-1"] : NOOP as any;
    }

    public handler(ctx: ApiContext) {
        const result = this.validator(ctx.request);
        if (!result) {
            ctx.attachments.putAttachment(RequestValidator.ValidationErrorsKey, this.validator.errors);
            ctx.response = {
                statusCode: 422,
                body: (typeof this.validator.errors[0] !== "string") ? (this.validator.errors as AJVTypes.ErrorObject[]).map(RequestValidator.renderError) : this.validator.errors,
                headers: {"Content-Type": "application/json"},
            };
        }
    }

    public static renderError(error: AJVTypes.ErrorObject) {
        return `ValidationError[${error.keyword}]: request${error.dataPath} ${error.message}`;
    }
}
