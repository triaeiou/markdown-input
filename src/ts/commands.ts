import * as commands from "@codemirror/commands"
import * as search from "search"
import * as cloze from "./CodeMirror.extensions/cloze"
import * as join_lines from "./CodeMirror.extensions/join_lines"
import * as custom_paste from "./CodeMirror.extensions/custom_paste"

const _fns: any[] = []

export function to_function(name: string) {
  if (!_fns.length) _init([commands, search, cloze, join_lines, custom_paste])
  return _fns[name]

  function _init(namespaces: any[]) {
    for (const namespace of namespaces)
      for (const [k, v] of Object.entries(namespace))
        _fns[k] = v
  }
}
