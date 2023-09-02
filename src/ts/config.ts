import * as commands from "@codemirror/commands"
import * as search from "search"
import * as cloze from "./CodeMirror.extensions/cloze"
import * as join_lines from "./CodeMirror.extensions/join_lines"
import * as custom_paste from "./custom_paste"
import { Configuration, EDITOR, KEYMAP, PASTE } from "./constants"

const _fns: any[] = []
function _to_function(name: string) {
  if (!_fns.length)
    for (const namespace of [commands, search, cloze, join_lines, custom_paste])
      for (const [k, v] of Object.entries(namespace)) _fns[k] = v

  return _fns[name]
}

function parse_config(cfg: Configuration): Configuration {
  for (const sc of cfg[EDITOR][KEYMAP]) {
    if('shift' in sc && typeof(sc.shift) !== 'function') sc.shift = _to_function(sc.shift as any)
    if('run' in sc && typeof(sc.run) !== 'function') sc.run = _to_function(sc.run as any)
  }
  for (const k of Object.keys(cfg[EDITOR][PASTE]))
    cfg[EDITOR][PASTE][k] = _to_function(cfg[EDITOR][PASTE][k])

  return cfg
}

export {parse_config}