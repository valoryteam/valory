# Logging

Logging in Valory is accomplished using Pino, and makes extensive use of child loggers.  Access to these loggers is provided in both middleware and endpoints with several options for customization. 

### Logging in routes

``` typescript
// The logger can be accessed through either injection or inheiritance within routes
@Route() export class SomeController extends Controller {
    @Get() public someEndpoint(@Request() ctx: ApiContext) {
        // Request will have a logger attached
        ctx.attachments.getAttachment(Endpoint.HandlerLoggerKey).info("stuff");
        
        // Because this controller inheirited from Controller, we can also access the
        // logger through "this"
        this.logger.info("a message");
    }
}
```

**Bound Fields**

* path
    * URL path
* method
    * HTTP method
* middleware
    * Set to "PrimaryHandler" for routes
* requestId
    * UUID for the request

### Logging in Middleware

```typescript
export class SomeMiddleware implements ApiMiddleware {
    public name = "SomeMiddleware";
    public handler(req, logger, done) {
        // The logger argument will contain the child logger for this middleware request
        logger.info("a message");
        done();
    }
}
```

**Bound Fields**

* path
    * URL path
* method
    * HTTP method
* middleware
    * Name of the middleware
* requestId
    * UUID for the request

### Logging Customization

The primary way to customize logging is by providing a custom base logger, but you can also provide a custom request log provider if you need to change the bound fields.

```typescript
import Pino = require("pino");

const app = Valory.createInstance({
   adaptor: new DefaultAdaptor(8080),
   openapi: {
       info: {
           title: "Test Api",
           version: "1"
       }
   },
    baseLogger: Pino()
});
```
