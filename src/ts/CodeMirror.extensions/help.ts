import { EditorView } from "@codemirror/view"
import { keybindings } from "../config"
import { dialog } from "./dialog"

function help(view: EditorView) {
    let msg = 'Loaded keybindings:<table><tbody>'
    for (const kb of keybindings()) {
        if (kb.key && kb.run?.name) {
            msg += `<tr><td>${kb.key}:</td><td>${kb.run.name}`
            if (kb.shift?.name) msg += ` (shift: ${kb.shift.name})`
            msg += '</td></tr>'
        }
    }
    msg += '</tbody></table>'
    dialog(view, msg, [{text: 'Ok'}])
    return true
}

export {help}