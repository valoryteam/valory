import {readFileSync, writeFileSync} from "fs";
import {fileSync} from "tmp";
import {ClosureCompiler} from "../../lib/closure-compiler";

const SUPPRESSED_ERRORS = "undefinedVars";
const INTERMEDIATE_PREFIX = "val_CI_";
const COMPILED_PREFIX = "val_C_";

export async function compileModule(module: string): Promise<string> {
    const intermediateFileTmp = fileSync({prefix: INTERMEDIATE_PREFIX});
    const compiledFileTmp = fileSync({prefix: COMPILED_PREFIX});
    writeFileSync(intermediateFileTmp.fd, module);

    const compilerFlags = {
        js: intermediateFileTmp.name,
        rewrite_polyfills: false,
        compilation_level: "ADVANCED",
        use_types_for_optimization: true,
        preserve_type_annotations: true,
        js_output_file: compiledFileTmp.name,
        language_out: "ECMASCRIPT_2016",
        jscomp_off: SUPPRESSED_ERRORS,
    };

    const compiler = new ClosureCompiler(compilerFlags);
    await compiler.runPromise();

    const compiledContent = readFileSync(compiledFileTmp.fd).toString("utf8");

    return `
    // @ts-nocheck
    /* tslint:disable */
    ${compiledContent}
    `;
}
