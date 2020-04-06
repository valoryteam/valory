# Adaptors

One of the central conceits of Valory is that it is not a web server, but instead uses adaptors to run on top of any server framework.
The [default adaptor](src/lib/default-adaptor.ts) is a decent example that uses polka.

```typescript
// adaptors implement ApiServer
export class SomeAdaptor implements ApiAdaptor {
    public register(path: string, method: HttpMethod, handler: (request: ApiContext) => Promise<ApiContext>) {
        // register an endpoint on the underlying server that runs a given handler
    }
    
    public start() {
        // Start the server and return anything you want exported from Valory.start
    }
    
    public shutdown() {
        // shutdown the underlying server
    }
}
```
