import type { RunRequest } from "./types";
export function pythonProgram(request: RunRequest) {
  const payload = [...new TextEncoder().encode(JSON.stringify(request))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `
import json, io, contextlib, inspect
_payload = json.loads(bytes.fromhex("${payload}").decode("utf-8"))
class _Output:
    def __init__(self): self.parts = []; self.remaining = 50000
    def write(self, text):
        text = str(text)
        if self.remaining > 0:
            self.parts.append(text[:self.remaining]); self.remaining -= len(text)
        return len(text)
    def flush(self): pass
_capture = _Output()
_result = {"cases": [], "logs": []}
_scope = {}
with contextlib.redirect_stdout(_capture), contextlib.redirect_stderr(_capture):
    try:
        exec(compile(_payload["code"], "solution.py", "exec"), _scope)
        _solve = _scope.get("solve")
        if not callable(_solve): raise ValueError("Define def solve(...) before running tests.")
        for _test in _payload["tests"]:
            try:
                _actual = _solve(*_test["args"])
                if inspect.isawaitable(_actual):
                    if hasattr(_actual, "close"): _actual.close()
                    raise TypeError("Return a synchronous value; async functions are not supported.")
                _encoded = json.dumps(_actual, allow_nan=False)
                if len(_encoded) > 20000: raise ValueError("Output exceeds 20,000 characters.")
                _result["cases"].append({"actual": json.loads(_encoded)})
            except Exception as _error:
                _result["cases"].append({"error": (type(_error).__name__ + ": " + str(_error))[:2000]})
    except Exception as _error:
        _result["error"] = (type(_error).__name__ + ": " + str(_error))[:2000]
_result["logs"] = "".join(_capture.parts).splitlines()[:50]
json.dumps(_result)
`;
}
