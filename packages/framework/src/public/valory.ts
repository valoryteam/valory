import { ApiMiddleware, HttpMethod } from './types.js';
import { ApiAdaptor } from './api-adaptor.js';
import { Endpoint } from '../runtime/index.js';

export interface IValoryArgs {
  beforeAllMiddleware?: ApiMiddleware[];
  afterAllMiddleware?: ApiMiddleware[];
  adaptor: ApiAdaptor;
}

export class Valory {
  private static instance: Valory;
  public readonly adaptor: ApiAdaptor;

  /** @internal */ public readonly beforeAllMiddleware: ApiMiddleware[];
  /** @internal */ public readonly afterAllMiddleware: ApiMiddleware[];

  public static createInstance(args: IValoryArgs) {
    if (Valory.instance != null) {
      return Valory.instance
    } else {
      Valory.instance = new Valory(args);
      return Valory.instance;
    }
  }

  public static getInstance() {
    if (Valory.instance == null) {throw new Error("Valory instance has not yet been created");}
    return Valory.instance;
  }

  private constructor(args: IValoryArgs) {
    const {adaptor, afterAllMiddleware, beforeAllMiddleware} = args;

    this.adaptor = adaptor;
    this.afterAllMiddleware = afterAllMiddleware || [];
    this.beforeAllMiddleware = beforeAllMiddleware || [];
  }

  private endpoint(path: string, method: HttpMethod) {
    return new Endpoint(this, path, method);
  }

  public start() {
    return this.adaptor.start();
  }

  public shutdown() {
    return this.adaptor.shutdown();
  }
}
