import {fork, ForkOptions} from "child_process";
import {join, dirname} from "path";

const closurePath = dirname(require.resolve("google-closure-compiler"));
const closureEntrypoint = "cli.js";
const closureCompiler = join(closurePath, closureEntrypoint);

/**
 * Manages starting and running closure spec-compiler, based on closure-spec-compiler.js
 * Used instead because included runner will not auto select platform
 */
export class ClosureCompiler {
    private commandArguments: string[] = [];

    constructor(args: {[key: string]: any}, public spawnOptions: ForkOptions = {silent: true}) {
        for (const key in args) {
            if (Array.isArray(args[key])) {
                for (let i = 0; i < args[key].length; i++) {
                    this.commandArguments.push(
                        this.formatArgument(key, args[key][i]));
                }
            } else {
                this.commandArguments.push(
                    this.formatArgument(key, args[key]));
            }
        }
    }

    public run(callback: (code: number, stdOut: string, stdError: string) => void) {
        let stdOutData = "";
        let stdErrData = "";
        const compileProcess = fork(closureCompiler, this.commandArguments, this.spawnOptions);
        if (compileProcess.stdout) {
            compileProcess.stdout.setEncoding("utf8");
            compileProcess.stdout.on("data", (data) => {
                stdOutData += data;
            });
            compileProcess.stdout.on("error", (err) => {
                stdErrData += err.toString();
            });
        }

        if (compileProcess.stderr) {
            compileProcess.stderr.setEncoding("utf8");
            compileProcess.stderr.on("data", (data) => {
                stdErrData += data;
            });
        }

        compileProcess.on("close",  (code) => {
            if (code !== 0) {
                stdErrData = this.prependFullCommand(stdErrData);
            }

            callback(code, stdOutData, stdErrData);
        });

        compileProcess.on("error", (err) => {
            callback(1, stdOutData,
                this.prependFullCommand("Process spawn error.\n" + err.message));
        });
        return compileProcess;
    }

    public runPromise(): Promise<{code: number, stdOut: string, stdError: string}> {
        return new Promise(((resolve, reject) => {
            this.run((code, stdOut, stdError) => {
                if (code !== 0) {reject(stdError);}
                resolve({code, stdError, stdOut});
            });
        }));
    }

    private getFullCommand() {
        return "node " + closureCompiler + " " + this.commandArguments.join(" ");
    }

    private prependFullCommand(msg: string) {
        return this.getFullCommand() + "\n\n" + msg + "\n\n";
    }

    private formatArgument(key: string, val: string | boolean | number): string {
        let normalizedKey = key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
        normalizedKey = normalizedKey.replace(/^--/, "");

        if (val === undefined || val === null) {
            return `--${normalizedKey}`;
        }

        return `--${normalizedKey}=${val}`;
    }
}
