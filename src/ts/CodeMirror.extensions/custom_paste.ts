import { EditorView } from "@codemirror/view"

type Callback = (result: Result) => void
interface Result {text: string, pos: number}
interface Options {
  handler: (view: EditorView, func: string, callback: Callback) => void,
  shortcuts: {name: string, shortcut: string}[]
}

class Sequence {
  shift = false
  alt = false
  meta = false
  key = ""

  constructor(sequence: string|KeyboardEvent) {
    if (typeof(sequence) === 'string') {
      for (const el of sequence.split('+')) {
        const el_ = el.toLocaleLowerCase()
        if (el_ === 'shift') this.shift = true
        else if (el_ === 'alt') this.alt = true
        else if (el_ === 'meta' || el_ === 'ctrl') this.meta = true
        else this.key = el_
      }
    } else {
      this.shift = sequence.shiftKey
      this.alt = sequence.altKey
      this.meta = sequence.metaKey || sequence.ctrlKey
      this.key = sequence.key.toLocaleLowerCase()
    }
  }

  is(other: Sequence) {
    return JSON.stringify(this) === JSON.stringify(other)
  }
}

/**
 * CodeMirror paste handler extension allowing custom pasting.
 * Uses callback as we cannot wrap this in async and the Anki bridge uses a callback
 */
function customPaste(options: Options) {
  
  function _paste(view: EditorView, func: string) {

    options.handler(view, func, cb)
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

  function _type(seq: Sequence) {
    for (const sc of options.shortcuts) {
      if (seq.is(new Sequence(sc.shortcut))) return sc.name
    }
    return null
  }

  return EditorView.domEventHandlers({
    paste(event, view) {
      const sc = _type(new Sequence("Ctrl+V"))
      if (sc) _paste(view, sc)
      return true // CM-specific, first handler to return true stops further handling
    },
    keydown(event: KeyboardEvent, view) {
      console.log(`custom paste: ${event.ctrlKey ? "Ctrl+" : ""}${event.altKey ? "Alt+" : ""}${event.shiftKey ? "Shift+" : ""}${event.metaKey ? "Meta+" : ""}${event.key}`)
      const sc = _type(new Sequence(event))
      if (sc) {
        _paste(view, sc)
        return true // CM-specific, first handler to return true stops further handling
      }
      return false
    }
  })
}

export type {Callback, Result, Options, Sequence}
export {customPaste}