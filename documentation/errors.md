# Errors

Unlike previous versions of Valory, version 4 does not have an opinionated errors system. The suggested approach shown
below is just that, a suggestion which uses no magic sugar.

## Suggested Approach: Mapped Exceptions
A simple approach to exception handling is to map any exceptions using an "after all middleware".

If an exception occurs somewhere in the chain...
```typescript
class CoolError extends Error {}

@Route() export class SomeRoute extends Controller {
    @Get() getStuff() {
        throw new CoolError();
    }
}
```

...Map it using a middleware into some response
```typescript
export const ErrorMapper: ApiMiddleware = {
    name: "ErrorMapper",
    handler(ctx: ApiContext) {
        // Bail if no exception occurred
        if (!ctx.attachments.hasAttachment(Endpoint.ExceptionKey)) {
            return;
        }
        
        const exception = ctx.attachments.getAttachment(Endpoint.ExceptionKey)
        if (exception instanceof CoolError) {
            ctx.response.body = "A cool error occurred";
            ctx.response.statusCode = 403;
        } else if (...) {
            // map some other errors
        } else {
            ctx.response.body = "Internal exception occurred";
            ctx.response.statusCode = 500;
        }
    }
}

// Add to afterAllMiddleware array
const app = Valory.createInstance({
   adaptor: new DefaultAdaptor(8080),
   afterAllMiddleware: [ErrorMapper],
   openapi: {
       info: {
           title: "Test Api",
           version: "1"
       }
   }
});
```

There are a lot of improvements that can be made here (Custom error base class, logging, etc...), but it should be a
good example of the type of things you can do.
