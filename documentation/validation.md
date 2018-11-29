# Validation
All requests to Valory endpoints are validated based off a swagger spec generated from Typescript definitions.
The goal was to make this as seamless and intuitive as possible, requiring minimal changes to style and workflow.
This is a simplified guide to explain some of the common cases and how to handle them.

### Form/JSON input
Form and JSON input is the easiest use case here, and is handled exactly as you would expect
```typescript
// Interfaces are the simplest way of handling most cases
export interface Item {
  field: string;
  // optional properties work as you would expect
  optionalProp?: string;
}

// Inheritance is also supported
export interface CoolItem extends Item {
  cool: boolean;
}

// If you need to include default values, then use a simple class
export class ItemWithDefaults {
    public field = "a default value";
    
    // Private fields are ignored
    private hidden: string;
}
```

### Reusable fields
Say you have a "name" field used multiple places. You could redefine it multiple places, but that would be require effort and violate DRY.
Type aliases to the rescue!

```typescript
/**
 * JSDOC properties are preserved whenever this is used
 */
export type Name = string;

// constant values are also supported
export type ConstantValue = "a value";
```
Additionally, type aliases are the only reference type allowed for Headers, Path, and Query parameters.

### Descriptions, examples, and Swagger validations
When writing api's you frequently need to be very specific about allowed inputs. This additional specifications is handled with JSDOC.
```typescript
// JSDOC properties are used to add swagger metadata
/**
 * JSDOC descriptions work as descriptions
 * @example "example value"
 * @minLength 5
 */
export type Name = string;
// all swagger parameter validation keywords are supported this way
// Supported keywords:
// isString, isBoolean, isInt, isLong, isFloat, isDouble, isDate, isDateTime, minItems, 
// maxItems, uniqueItems, minLength, maxLength, pattern, minimum, maximum, minDate, 
// maxDate, 


// Also works on properties in complex objects
/**
 * a description
 */
export interface Item {
    /**
     * property description
     * @maxLength 47
     */
    prop: string;
}
```