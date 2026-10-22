import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
import variant from "@jitl/quickjs-singlefile-browser-release-sync";
import { execute } from "./engine";
import type { RunRequest } from "./types";
const ready = newQuickJSWASMModuleFromVariant(variant);
self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try {
    self.postMessage(execute(await ready, event.data));
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
