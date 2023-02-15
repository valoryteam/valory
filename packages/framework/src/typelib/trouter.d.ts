declare module "trouter" {
  export default class Trouter<T = Function> {
    find(method: Methods, url: string): {
      params: Record<string, string>;
      handlers: T[];
    };
    add(method: Methods, pattern: Pattern, ...handlers: T[]): this;
    use(pattern: Pattern, ...handlers: T[]): this;
    all(pattern: Pattern, ...handlers: T[]): this;
    get(pattern: Pattern, ...handlers: T[]): this;
    head(pattern: Pattern, ...handlers: T[]): this;
    patch(pattern: Pattern, ...handlers: T[]): this;
    options(pattern: Pattern, ...handlers: T[]): this;
    connect(pattern: Pattern, ...handlers: T[]): this;
    delete(pattern: Pattern, ...handlers: T[]): this;
    trace(pattern: Pattern, ...handlers: T[]): this;
    post(pattern: Pattern, ...handlers: T[]): this;
    put(pattern: Pattern, ...handlers: T[]): this;
  }

}
