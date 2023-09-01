import { EditorView } from "@codemirror/view"

export interface Modifiers {shift?: boolean, alt?: boolean, meta?: boolean}
export interface Result {text: string, pos: number}
export type Callback = (result: Result) => void
export type Handler = (callback: Callback, alt: boolean) => void

/**
 * CodeMirror paste handler extension, modify text to be pasted and where to put cursor
 * Uses ugly callback as we cannot wrap this in async and the Anki bridge uses a callback
 */
export function custom_paste(handler: Handler) {
  function _paste(view: EditorView, alt: boolean) {
    handler(cb, alt)
    return true

    function cb(res: Result) {
      // Paste content
      if (res.text) {
        const selection = view.state.selection
        const trs: {}[] = []
        selection.ranges.forEach((rng, n) => {
          trs.push({
            changes: {
              from: rng.from, to: rng.to,
              insert: res.text
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
      _paste(view, false)
      return true // CM-specific, first handler to return true stops further handling
    },
    keydown(event: KeyboardEvent, view) {
      if (
        (event.ctrlKey || event.metaKey) && event.shiftKey &&
        event.key.toLocaleLowerCase() === 'v'
      ) {
        _paste(view, true)
        return true // CM-specific, first handler to return true stops further handling
      }
      return false
    }
  })
}
