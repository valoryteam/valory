import {ApiResponse} from "../server/valoryheaders";

export interface ResponseMatrix {
	handlerResponse: ApiResponse | null;
	validatorResponse: ApiResponse | null;
	preMiddlewareResponse: ApiResponse | null;
	postMiddlewareResponse: ApiResponse | null;
	errorResponse: ApiResponse | null;
}

export function getResponse(mtx: ResponseMatrix): {response: ApiResponse | null, isHandler: boolean} {
	const response = mtx.postMiddlewareResponse || mtx.errorResponse || mtx.preMiddlewareResponse || mtx.validatorResponse;
	if (response == null) {
		return {response: mtx.handlerResponse, isHandler: true};
	} else {
		return {response, isHandler: false};
	}
}
