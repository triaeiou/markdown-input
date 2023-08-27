import { EditorView } from "@codemirror/view"

export interface Result {markdown: string, pos: number}
export type Callback = (result: Result) => void
export type Handler = (clipboard: DataTransfer, callback: Callback) => void

const modifier_state = {
  shift: 0,
  ctrl: 0,
  alt: 0,
}

/**
 * TODO
 * Remove image paste option
 * Add keydown/up shift_state = evt.key.toLowerCase() === 'shift' || evt.modifiers.shift
 * Add mousedown, mouseup shift_state = evt.modifiers shift
 * handler called with modifier state
 */

/**
 * Custom paste handler extension, modify text to be pasted and where to put cursor
 * Uses ugly callback as we cannot wrap this in async and the Anki bridge uses a callback
 */
export function custom_paste(handler: Handler) {
  function _paste(alt: boolean, clipboard: DataTransfer, view: EditorView) {
    handler(clipboard, cb)
    return true

    function cb(res: Result) {   
      // Paste content
      if (res.markdown) {
        const selection = view.state.selection
        const trs: {}[] = []
        selection.ranges.forEach((rng, n) => {
          trs.push({
            changes: {
              from: rng.from, to: rng.to,
              insert: res.markdown
            }
          })
        })
        view.dispatch(...trs)
      }
  
      // Move cursor to correct position
      if (res.pos > 0) view.dispatch({
        selection: {
          anchor: view.state.selection.main.from + res.pos
        }
      })
    }
  }
  return EditorView.domEventHandlers({
    paste(event, view) {
      console.log('paste event')
      _paste(false, event.clipboardData, view)
    },
    keydown(event: KeyboardEvent, view) {
      console.log('key: ' + event.key + ", shift: " + event.shiftKey + ", ctrl: " + event.ctrlKey)
      if (
        event.ctrlKey &&
        event.shiftKey &&
        !event.altKey &&
        !event.metaKey &&
        event.key.toLocaleLowerCase() === 'v'
      ) {
        console.log('alt paste')
        event.preventDefault()
        const paste = new ClipboardEvent('paste')
        paste['alt-paste'] = true
        view.dom.dispatchEvent(paste)
        return true
      }
      return false
    }/* ,
    keydown(event: KeyboardEvent, view) {
      switch(event.key.toLowerCase()) {
          case 'shift':
              modifier_state.shift++
              break
          case 'control':
              modifier_state.ctrl++
              break
          case 'alt':
              modifier_state.alt++
              break            
      }
    },
    keyup(event: KeyboardEvent, view) {
        switch(event.key.toLowerCase()) {
            case 'shift':
                modifier_state.shift--
                break
            case 'control':
                modifier_state.ctrl--
                break
            case 'alt':
                modifier_state.alt--
                break
        }
    } */
  })
}
