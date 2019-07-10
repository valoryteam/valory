import {Logger} from "pino";
import {Serializer} from "../compiler/compilerheaders";
import {ApiRequest} from "./request";
import {Valory} from "./valory";
import {ApiMiddleware, ApiResponse} from "./valoryheaders";
const flatStr = require("flatstr");

export class RequestLoggerMiddleware implements ApiMiddleware {
	public name = "RequestLoggerMiddleware";
	constructor(private valoryInstance: Valory, public logRequest: (req: ApiRequest, res: ApiResponse, id: string) => void) {}

	public handler(req: ApiRequest, logger: Logger, done: (res?: ApiResponse) => void) {
		const res = req.getAttachment(Valory.ResponseKey);
		const id = req.getAttachment(Valory.RequestIDKey);
		// res.headers[this.valoryInstance.requestIDName] = id;
		this.logRequest(req, res, id);
		done();
	}
}

export class RequestSerializerMiddleware implements ApiMiddleware {
	public name = "RequestSerializerMiddleware";
	constructor(private valoryInstance: Valory, public serializer: Serializer) {}
	public handler(req: ApiRequest, logger: Logger, done: (res?: ApiResponse) => void) {
		const handlerResponded = req.getAttachment(Valory.HandlerResponded);
		const res = req.getAttachment(Valory.ResponseKey);
		if (handlerResponded && !res.disableSerializer) {
			try {
				res.body = flatStr(this.serializer(res.body));
			} catch (e) {
				logger.error("Failed to serialize response");
				req.putAttachment(Valory.ResponseKey, this.valoryInstance.buildError("InternalError"));
			}
		}
		done();
	}
}

export const CORSMiddleware = {

};

// export function initialize
