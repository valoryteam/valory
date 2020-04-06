#!/usr/bin/env node

import yargs = require("yargs");
import {CompileCommand} from "./compile-command";
import {TestCommand} from "./test-command";
import {InitCommand} from "./init-command";
require("ts-node").register({
    pretty: false,
    typeCheck: false,
    transpileOnly: true,
});

yargs.command(CompileCommand)
    .command(TestCommand)
    .command(InitCommand)
    .demandCommand()
    .parse();
