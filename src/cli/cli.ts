#!/usr/bin/env node

import yargs = require("yargs");
import {CompileCommand} from "./compile-command";
require("ts-node").register({
    pretty: false,
    typeCheck: false,
    transpileOnly: true,
});

yargs.command(CompileCommand)
    .demandCommand()
    .parse();
