# Request Identification

Valory uses [hyperid](https://www.npmjs.com/package/hyperid) to generate a unique identifier for every request. This identifier is included in logs and returned to the user in a header. This can greatly speed up debugging as it allows easy correlation between a given request and all of the logs associated with it.

```typescript
export interface SomeController extends Controller {
    @Get() public something() {
        // This log message will include the request id
        this.logger.info("stuff")
    }
}
```

### Changing the header name

You can customize the name of the request id property in both logs and the returned header.

```typescript
Valory.createInstance({
	info: infoObject,
    server: someAdaptor,
    // This will set the name used for request id. Must be a valid http header name.
    requestIDName: "some-other-name"
});
```

