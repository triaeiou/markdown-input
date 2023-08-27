import {EditorView} from "@codemirror/view"

const state = {
    shift: 0,
    ctrl: 0,
    alt: 0,
}

const modifiers = EditorView.domEventHandlers({
    keydown(event: KeyboardEvent, view) {
        switch(event.key.toLowerCase()) {
            case 'shift':
                state.shift++
                break
            case 'control':
                state.ctrl++
                break
            case 'alt':
                state.alt++
                break            
        }
    },
    keyup(event: KeyboardEvent, view) {
        switch(event.key.toLowerCase()) {
            case 'shift':
                state.shift--
                break
            case 'control':
                state.ctrl--
                break
            case 'alt':
                state.alt--
                break            
        }
    }
})
  
  
  export {modifiers, state}