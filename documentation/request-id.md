# Request Identification

Valory uses [hyperid](https://www.npmjs.com/package/hyperid) to generate a unique identifier for every request.
This identifier is included in logs, and can easily be returned to the user. This can greatly speed up debugging as it
allows easy correlation between a given request and all of the logs associated with it.

```typescript
export interface SomeController extends Controller {
    @Get() public something() {
        // This log message will include the request id
        this.logger.info("stuff")
    }
}

// You can easily return this id for every request using a middleware.
export const RequestIDMiddleware: ApiMiddleware = {
    name: "RequestIDMiddleware",
    handler(ctx) {
        ctx.response.headers["request-id"] = ctx.requestId;
    }
};
```

