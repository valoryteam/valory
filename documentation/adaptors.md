# Adaptors

One of the central conceits of Valory is that it is not a web server, but instead uses adaptors to run on top of any server framework.
The [default adaptor](src/lib/defaultAdaptor.ts) is a decent example that uses fastify.

```typescript
// adaptors implement ApiServer
export class SomeAdaptor implements ApiServer {
    public readonly locallyRunnable = true; // Whether or not the adaptor can be run locally
    public readonly allowDocSite = true; // Whether or not a ReDoc site should be created on startup
    
    public register(path: string, method: HttpMethod, handler: (request: ApiRequest) => ApiResponse | Promise<ApiResponse>) {
        // register an endpoint on the underlying server that runs a given handler
    }
    
    public getExport(metadata: ValoryMetadata, options: any) {
        // Start the server using options if needed
    }
    
    public shutdown() {
        // shutdown the underlying server
    }
}
```