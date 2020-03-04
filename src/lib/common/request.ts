import {ApiExchange, HttpMethod} from "./headers";
import {Map} from "./util";

export interface ApiRequest extends ApiExchange {
    rawBody: any;
    formData: Map<any>;
    queryParams: Map<any>;
    pathParams: Map<any>;
    path: string;
    method: HttpMethod;
}
