import {ApiMiddleware} from "../../lib/common/middleware";
import {HttpMethod} from "../../lib/common/headers";
import {Valory} from "../valory";
import {ApiContext} from "../../lib/common/context";
import {AttachmentRegistry} from "../../lib/common/attachment-registry";
import {AJVTypes} from "../../lib/common/compiler-headers";

export class RequestValidator implements ApiMiddleware {
    public static ValidationErrorsKey = AttachmentRegistry.createKey<AJVTypes.ErrorObject[]>();

    public readonly name = "RequestValidator";
    private readonly validator: AJVTypes.ValidateFunction;

    constructor(valory: Valory, path: string, method: HttpMethod) {
        this.validator = valory.globalData.validation?.validators[path][method]["-1"]
    }

    public handler(ctx: ApiContext) {
        const result = this.validator(ctx.request);
        if (!result) {
            ctx.attachments.putAttachment(RequestValidator.ValidationErrorsKey, this.validator.errors);
            ctx.response = {
                statusCode: 422,
                body: this.validator.errors.map(RequestValidator.renderError),
                headers: {"Content-Type": "application/json"},
            }
        }
    }

    public static renderError(error: AJVTypes.ErrorObject) {
        return `ValidationError[${error.keyword}]: request${error.dataPath} ${error.message}`
    }
}
