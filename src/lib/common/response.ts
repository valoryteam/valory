import {ApiExchange} from "./headers";

export interface ApiResponse extends ApiExchange {
    statusCode: number;
}
