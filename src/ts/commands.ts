import type { EditorView, KeyBinding } from "@codemirror/view"
import * as commands from "@codemirror/commands"
import * as search from "search"
import * as cloze from "./CodeMirror.extensions/cloze"
import * as join_lines from "./CodeMirror.extensions/join_lines"
import * as custom_paste from "./custom_paste"

const _fns: any[] = []
function to_function(name: string): (view: EditorView) => boolean {
  if (!_fns.length) {
    for (const namespace of [commands, search, cloze, join_lines, custom_paste]) {
      for (const [k, v] of Object.entries(namespace)) {
        console.log("adding " + k + ": " + typeof(v))
        _fns[k] = v
      }
    }
  }

  console.log("got function " + typeof(_fns[name]))
  return _fns[name]
}

function parse_keymap(shortcuts): KeyBinding[] {
  const km = []
  for (const sc of shortcuts) {
    const kb: KeyBinding = {key: sc.key}
    if('shift' in sc) kb.shift = to_function(sc.shift)
    if('run' in sc) kb.run = to_function(sc.run)
    if('scope' in sc) kb.scope = sc.scope
    if('preventDefault' in sc) kb.preventDefault = sc.preventDefault
    km.push(kb)
  }
  console.log("built keymap " + JSON.stringify(km))
  return km
}

export {to_function, parse_keymap}