# Serialization
Valory has built in support for static response serialization, using compile time type information to generate fast serialization functions. This obviously has a speed advantage, but more importantly it enforces intentional choices about what is returned and helps to prevent leaks. 

```typescript
@Route()
export class SomeController extends Controller {
    // Serializers work of off detected types, so something like this 
    // will just work
    @Get() public thing() {
        return {
            stuff: "something"
        }
    }
    
    // If you set the type explicitly, you can get guarentees about what 
    // will be returned
    @Get("other") public other(): {bool: boolean} {
        return {
            bool: true,
            // Properties not included in the return type will be omitted
            junk: "this property will be omitted"
        } as any;
    }
    
    // Explicit types will also catch cases where you might return an
    // invalid response
    @Get("broken") public broken(): {requiredProp: string} {
        return {
            // This will return a generic failure to the user, and log a
            // message on the server about a broken schema.
        } as any;
    }
    
    // You can also disable this on an endpoint or controller level,
    // instead leaving it to the underlying server to serialize the
    // response
    @DisableSerialization @Get("noserial") public noSerial() {
        return {
            stuff: 
        }
    }
}
```