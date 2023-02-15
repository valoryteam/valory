import { ApiContext } from './context.js';
import { HttpHeaders } from './types.js';

export abstract class Controller {
  /**
   * Holds the request logger
   */
  private statusCode: number = 200;
  private statusSet = false;
  private headers = {} as HttpHeaders;

  private constructor(private readonly ctx: ApiContext) {}

  /**
   * Set the returned status code.
   */
  public setStatus(statusCode: number) {
    this.statusSet = true;
    this.statusCode = statusCode;
  }

  /**
   * Get the current status code.
   */
  public getStatus() {
    return this.statusCode;
  }

  /**
   * Set a header to a given value
   */
  public setHeader(name: string, value: string | number) {
    this.headers[name.toLowerCase()] = value;
  }

  /**
   * Get the current value of a header
   */
  public getHeader(name: string) {
    return this.headers[name];
  }

  /**
   * Get the current set of headers
   */
  public getHeaders() {
    return this.headers;
  }

  /**
   * Reset the status code to 200. Used internally.
   */
  public clearStatus() {
    this.statusSet = false;
    this.statusCode = 200;
  }

  /**
   * Reset the headers map. Used internally.
   */
  public clearHeaders() {
    this.headers = {};
  }
}
