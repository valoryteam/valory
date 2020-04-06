# Validation
All requests to Valory endpoints are validated based off an OpenAPI 3 spec generated from Typescript definitions.
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

### Unions
With OpenAPI 3, oneOf/anyOf type unions are available. For instance, say you require an Animal as an input,
but don't really care whether that animal is a Cat, Dog, or a Tribble. This is handled best with a disciminated union.
```typescript
// Create some models that you want to accept
export interface Cat {
	// For best results, use a shared discriminating property so that the type can quickly be determined at runtime
	type: "Cat";
	huntingAbility: number;
}

export interface Dog {
	type: "Dog";
	tailWagging: boolean;
}

export interface Tribble {
	type: "Tribble";
	fuzziness: number;
}

// Create a union of the models
export type Animal = Cat | Dog | Tribble;

@Route() export class SomeController extends Controller {
	@Post() public submit(@Body() animal: Animal) {
		// typescript has excellent support for discriminated unions, 
		// so property access will be typesafe
		switch (animal.type) {
			case "Cat":
				return animal.huntingAbility;
            case "Dog":
            	return animal.tailWagging;
            case "Tribble":
            	return animal.fuzziness;
		}
	}
}
```

### Enums
Enums are a good way to lock down a field to a discrete set of values.
```typescript
// The enum declaration is supported
export enum SomeEnum {
	// NOTE: the default value for enums is a number, which is likely not what you want
	Field = "value",
	Other = "thing",
}

// Const enums are also supported
export const enum Colors {
	Red = "r", Blue = "b", Green = "g"
}

// Enums with a single property are collapsed into constants
export enum SingleValue {
	prop
}

// Union enums work fine as well
export interface SomeModel {
	field: "enum" | "values";
	other: boolean;
}

// NOTE: computed enums are not supported
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
