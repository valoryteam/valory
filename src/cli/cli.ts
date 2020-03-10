#!/usr/bin/env node

import yargs = require("yargs");
import {CompileCommand} from "./compile-command";
import {TestCommand} from "./test-command";
require("ts-node").register({
    pretty: false,
    typeCheck: false,
    transpileOnly: true,
});

yargs.command(CompileCommand)
    .command(TestCommand)
    .demandCommand()
    .parse();
