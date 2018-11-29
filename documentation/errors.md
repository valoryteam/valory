# Errors

Valory provides a simple way to manage reusable error messages. Just pass a map of [[ErrorDef]] objects when creating the Valory instance.

**Creating Errors**
```typescript
const errors: {[name: string]: ErrorDef} = {
    // The key is used as the error name
    SomeError: {
        statusCode: 200, // http status code
        errorCode: 1337, // error code returned in the response body
        defaultMessage: "Something bad happened", // default message in the response body
    }
};

// Errors must be registered when you initially create the valory instance
Valory.createInstance({
    info,
    server: new FastifyAdaptor(),

    errors: [error], // You can include as many errors as you want
});
```
**Using Errors**
```typescript
@Route("/") export class SimpleController extends Controller {
    // you can use the Request decorator to get the full request object
    @Middleware(new middleware())
    @Get("somepath") public someHandler(@Request() req: ApiRequest) {
        return this.buildError("SomeError", "default message override");
    }
}
```

### Overriding the default error format
By default, errors are output in the format:
```
body: {
   code: "The errorCode",
   message: "The error message",
}
```
If this behaviour is not to your liking, you can override it by specifying an alternate [[ErrorFormatter]].
```typescript
// Just accept an ErrorDef and a message string, and then return an ApiRequest
const errorFormatter: ErrorFormatter = (error, message): ApiResponse => {
    return {
        statusCode: error.statusCode,
        body: {
            status_code: error.errorCode,
            message: (message != null) ? message : error.defaultMessage,
        },
        headers: {"Content-Type": "application/json"},
    };
}

// Then set the error formatter
valoryInstance.setErrorFormatter(errorFormatter);
```