import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
import variant from "@jitl/quickjs-singlefile-browser-release-sync";
import { transform } from "sucrase";
import { execute } from "./engine";
import type { RunRequest } from "./types";
const ready = newQuickJSWASMModuleFromVariant(variant);
self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try {
    const request = event.data;
    const code =
      request.language === "typescript"
        ? transform(request.code, {
            transforms: ["typescript"],
            filePath: "solution.ts",
          }).code
        : request.code;
    self.postMessage(execute(await ready, { ...request, code }));
  } catch (error) {
    self.postMessage({
      cases: [],
      logs: [],
      durationMs: 0,
      error:
        error instanceof Error
          ? error.message
          : "The code runner could not start.",
    });
  }
};
