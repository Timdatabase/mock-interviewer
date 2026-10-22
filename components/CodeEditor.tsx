"use client";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
const extensions = [javascript()];
export default function CodeEditor({
  code,
  onChange,
  onCursor,
}: {
  code: string;
  onChange: (value: string) => void;
  onCursor: (line: number) => void;
}) {
  return (
    <CodeMirror
      value={code}
      height="410px"
      theme={oneDark}
      extensions={extensions}
      aria-label="JavaScript solution editor"
      indentWithTab
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        autocompletion: true,
        bracketMatching: true,
      }}
      onChange={(value) => onChange(value.slice(0, 24000))}
      onUpdate={(update) => {
        if (update.selectionSet)
          onCursor(
            update.state.doc.lineAt(update.state.selection.main.head).number,
          );
      }}
    />
  );
}
