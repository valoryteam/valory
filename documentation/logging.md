# Logging

Logging in Valory is accomplished using Pino, and makes extensive use of child loggers.  Access to these loggers is provided in both middleware and endpoints with several options for customization. 

### Logging in routes

``` typescript
// The logger can be accessed through either injection or inheiritance within routes
@Route() export class SomeController extends Controller {
    @Get() public someEndpoint(@Logger() logger: Logger) {
        // @Logger will inject the request logger
        logger.info("a message");
        
        // Because this controller inheirited from Controller, we can also access the
        // logger through "this"
        this.logger("a message");
    }
}
```

**Bound Fields**

* requestId
  * The request ID associated with this request. The name of this property can be changed when creating the Valory instance.
* endpoint
  * The endpoint the request was received on.

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

* requestId
  * The request ID associated with this request. The name of this property can be changed when creating the Valory instance.
* endpoint
  * Then endpoint the request was received on.
* middleware
  * The name of the middleware

### Logging Customization

The primary way to customize logging is by providing a custom base logger, but you can also provide a custom request log provider if you need to change the bound fields.

```typescript
import Pino = require("pino");

const app = Valory.createInstance({
    info: {title: "An api"},
    server: new SomeAdaptor(),
    // You can pass a custom Pino logger to be used as a base
    baseLogger: Pino(),
})

// You can also set a custom log provider
app.setRequestLogProvider((parent, requestCtx) => {
    // The logger returned here will be the parent for the loggers provided to the
    // handler and middleware
    return parent.child({
        somekindofbinding: "a value",
        id: requestCtx.requestId,
    })
});
```

### Audit Logs

Valory can also log the full request/response to an external file by setting the environment variable REQUEST_AUDIT_LOG to the name of a file. This cannot be changed while running.
