"use client";
import { MAX_CODE_CHARACTERS } from "@/lib/interview/limits";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import { python } from "@codemirror/lang-python";
import type { CodeLanguage } from "@/lib/runner/languages";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

export default function CodeEditor({
  code,
  language,
  onChange,
  onCursor,
}: {
  code: string;
  language: CodeLanguage;
  onChange: (value: string) => void;
  onCursor: (line: number) => void;
}) {
  const extensions = useMemo(
    () => [
      language === "python"
        ? python()
        : javascript({ typescript: language === "typescript" }),
    ],
    [language],
  );
  return (
    <CodeMirror
      value={code}
      height="100%"
      className="solution-editor"
      theme={oneDark}
      extensions={extensions}
      aria-label={`${language} solution editor`}
      indentWithTab
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        autocompletion: true,
        bracketMatching: true,
      }}
      onChange={(value) => onChange(value.slice(0, MAX_CODE_CHARACTERS))}
      onUpdate={(update) => {
        if (update.selectionSet)
          onCursor(
            update.state.doc.lineAt(update.state.selection.main.head).number,
          );
      }}
    />
  );
}
