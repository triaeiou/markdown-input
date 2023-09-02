import * as commands from "@codemirror/commands"
import * as search from "search"
import * as cloze from "./CodeMirror.extensions/cloze"
import * as join_lines from "./CodeMirror.extensions/join_lines"
import * as custom_paste from "./custom_paste"
import { Configuration, EDITOR, KEYMAP } from "./constants"

function parse_config(cfg: Configuration): Configuration {
  if (!parse_config['functions']) {
    parse_config['functions'] = {}
    for (const namespace of [commands, search, cloze, join_lines, custom_paste])
      for (const [k, v] of Object.entries(namespace)) parse_config['functions'][k] = v
  }
  
  for (const sc of cfg[EDITOR][KEYMAP]) {
    if('shift' in sc && typeof(sc.shift) !== 'function') sc.shift = parse_config['functions'][sc.shift]
    if('run' in sc && typeof(sc.run) !== 'function') sc.run = parse_config['functions'][sc.run]
  }

  return cfg
}

export {parse_config}