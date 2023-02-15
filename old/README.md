[![npm](https://img.shields.io/npm/v/valory.svg)]()
[![Codeship Status for valoryteam/valory](https://app.codeship.com/projects/b6f4f1f0-fd8c-0136-c8d1-16d62b820b2a/status?branch=master)](https://app.codeship.com/projects/322569)
# Valory
*A server agnostic web framework for creating bulletproof apis*


[![NPM](https://nodei.co/npm/valory.png)](https://nodei.co/npm/valory/)
## Contents
* [Documentation](documentation/index.md)
* [Example Project](https://github.com/valoryteam/valory-example)
* [Description](#description)
* [Installation](#installation)
* [Basic Usage](#basic-usage)
* [Extensions](#extensions)
* [Contributions](#contributions)
* [Acknowledgements](#acknowledgements)

## Description
Valory is small framework designed to standardize the process of writing well documented, bulletproof api's using whatever server backend you want.

**What it do**
* First class Typescript support with decorator based API
* Uses existing type structures to build out your API
* Automatically generates Open API 3 documentation
* Performs super fast input validations for requests
* Modular adaptor system that allows you to use anything that can send an event to NodeJS as a REST server

**What it don't do**
* Make you write your code and docs separately

## Installation
If you are on windows, you will want to install Java 1.7+. Closure compiler will work without it, but will be slow.

Next, you'll need to add the Valory runtime to your project along with a server adaptor
```bash
npm install valory-runtime valory-adaptor-polka
```
Next, install the cli
```bash
npm i -g valory

# You can install it locally as well for build consistency
npm i -D valory
```

Lastly, you'll need to create a Valory project
```bash
# Run in your project dir and commit the valory.json file
valory init
```
## Basic Usage
Using Valory is pretty straightforward.

**index.ts**
```typescript
import {Valory, Swagger} from "valory-runtime";
import {PolkaAdaptor} from "valory-adaptor-polka"

// import our controller
import "./someController"

// import generated content
import "./generated"

// Define basic info for the api
const info: Swagger.Info = {
	title: "Test api",
	version: "1",
};

// Create the valory singleton
Valory.createInstance({
    info,
    server: new PolkaAdaptor({port: 8080}),
});

// Retrieve the valory instance (can be called anywhere)
const valoryInstance = Valory.getInstance();

// Build and start the app, passing any adaptor specific config data
valoryInstance.start();
```

**someController.ts**
```typescript
import {Get, Route, Controller, Post, Body, Path, Header, SuccessResponse} from "valory-runtime";

export interface Item {
    someField: string;
    optionalField?: string;
    aNumber: number;
}

// Use fancy decorators to generate endpoints
@Route("base") export class SimpleController extends Controller {
    /**
     * Swagger endpoint description
     * @summary swagger summary
     */
    @Get("somepath") public someHandler() {
        return "Some response"
    }
    
    // Function arguments can be injected from request object   
    @Get("{name}") public async someOtherHandler(@Path() name: string, @Header() authorization: string): Promise<string> {
        return `name is ${name}`;
    }
    
    // You can set the status of a successful response 
    @SuccessResponse(418)
    // even complex types work    
    @Post("submit") public submit(@Body() input: Item): {content: Item} {
        
        // access request logger
        this.logger.info("yay!");
        
        return {
            content: input,
        }
    }
}

```

Once you have your api written, you have to compile it.
```bash
# Just run in your project dir next to your valory.json
valory compile
```

Now all you need to do is run it
```bash
# This will be adaptor specific
node path/to/api.js

# Valory provides an adaptor agnostic test command
valory test
```

## Extensions
These are the officially maintained adaptors and middleware available for Valory.

**Adaptors**
* [valory-adaptor-polka](https://www.npmjs.com/package/valory-adaptor-polka)
    * Adaptor that uses polka (Smallest size)
* [valory-adaptor-alb](https://www.npmjs.com/package/valory-adaptor-alb)
    * Adaptor for directly processing events from an AWS Application Load Balancer

## Contributions
PR's are welcome!

**PR guidelines**
* Use [Angular Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)
* Create an issue that explains the problem or feature
  * Get approval on the issue from a maintainer
* Create a PR the references the issue

**Roadmap**
- [ ] More comprehensive tests
- [ ] Additional adaptors

## Acknowledgements
- Shoutout to [TSOA](https://github.com/lukeautry/tsoa). Decorator support in Valory is based on that project, huge :thumbsup:
