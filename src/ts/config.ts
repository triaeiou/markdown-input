import * as commands from "@codemirror/commands"
import * as search from "search"
import * as cloze from "./CodeMirror.extensions/cloze"
import * as join_lines from "./CodeMirror.extensions/join_lines"
import * as custom_paste from "./custom_paste"
import * as help from "./CodeMirror.extensions/help"
import * as image from "./CodeMirror.extensions/preview"

import { Configuration, EDITOR, KEYMAP } from "./constants"
import { KeyBinding } from "@codemirror/view"

function parse(cfg: Configuration): Configuration {
  if (!parse['functions']) {
    parse['functions'] = {}
    for (const namespace of [commands, search, cloze, join_lines, custom_paste, help, image])
      for (const [k, v] of Object.entries(namespace)) parse['functions'][k] = v
  }
  
  for (const sc of cfg[EDITOR][KEYMAP]) {
    if('shift' in sc && typeof(sc.shift) !== 'function') sc.shift = parse['functions'][sc.shift]
    if('run' in sc && typeof(sc.run) !== 'function') sc.run = parse['functions'][sc.run]
  }
  keybindings['keybindings'] = cfg[EDITOR][KEYMAP]

  return cfg
}

/** Return list of custom key bindings */
function keybindings(): KeyBinding[] {
  return keybindings['keybindings']
}

export {parse, keybindings}