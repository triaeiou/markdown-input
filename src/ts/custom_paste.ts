import {EditorView} from './editor'
import {Converter} from 'anki-md-html'
import {currentOrdinal} from './CodeMirror.extensions/cloze'

/** Anki webview js-py bridge */
declare function bridgeCommand(msg: string): void
/** Anki webview js-py bridge with callback*/
declare function bridgeCommand(msg: string, cb: (txt: string|object) => void): string
/** Data object of what is present in clipboard */
interface Contents {
  html: boolean
  text: boolean
  image: boolean
}

function _paste(
  view: EditorView,
  format: 'md'|'txt',
  transform?: 'strip'|'append'
) {

  function objectify(val: string|object): object {
    return typeof(val) === 'object'
      ? val
      : JSON.parse(val)
  }

  function tr(transform: undefined|'strip'|'append', txt: string) {
    if (!transform) return txt
    else if (transform === 'strip') return txt.replace(/(?:\{\{c\d+::|\}\})/g, '')
    else {
      // Find all ordinals and sort
      const ords = [...new Set(txt.matchAll(/\{\{c(\d+)::/gi))]
        .map((e) => parseInt(e[1]))
        .sort()

      // Map to new ordinals
      let ord = currentOrdinal(view)
      const ords_map = {}
      for (const o of ords) ords_map[o] = ++ord

      // Then find and replace
      return txt.replace(/\{\{c(\d+)::/g, (match, p1) => {
        return `{{c${ords_map[parseInt(p1)]}::`
      })
    }
  }

  function write_to_dom(txt: string, pos: number) {
    // Insert text
    const selection = view.state.selection
    const trs: {}[] = []
    selection.ranges.forEach((rng, n) => {
      trs.push({
        changes: {
          from: rng.from, to: rng.to,
          insert: txt
        }
      })
    })
    view.dispatch(...trs)
  
    // Move cursor to correct position
    view.dispatch({selection: {anchor: view.state.selection.main.from + pos}})
  }
  console.log("entering _paste")

  bridgeCommand('clipboard-contents', (res) => {
    // Unclear why aqt bridge returns JSON string and QWebChannel returns object
    const contents = objectify(res) as Contents

    if (contents.html && format === 'md') {
      bridgeCommand('clipboard-html', (html: string) => {
        let md = this['converter'].html_to_markdown(html)
        if (md) {
          md = tr(transform, md)
          write_to_dom(md, md.length)
        }
      })
    } else if (contents.text && format === 'txt') {
      bridgeCommand('clipboard-text', (txt: string) => {
        txt = tr(transform, txt)
        write_to_dom(txt, txt.length)
      })
    } else if (contents.image && format === 'md') {
      bridgeCommand('clipboard-image', (img: string) => {
        if (img) write_to_dom(img, 2)
      })
    }
  })

  return true
}

const pasteMarkdown = (view: EditorView) => _paste(view, 'md')
const pasteMarkdownStrip = (view: EditorView) => _paste(view, 'md', 'strip')
const pasteMarkdownAppend = (view: EditorView) => _paste(view, 'md', 'append')
const pasteText = (view: EditorView) => _paste(view, 'txt')
const pasteTextStrip = (view: EditorView) => _paste(view, 'txt', 'strip')
const pasteTextAppend = (view: EditorView) => _paste(view, 'txt', 'append')
const customPaste = (converter: Converter) => {
  _paste['converter'] = converter
  return EditorView.domEventHandlers({
    // Override built-in paste
    paste(event, view) {
      return true // CM-specific, first handler to return true stops further handling
    }
  })
}


/*
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
*/
export {customPaste, pasteMarkdown, pasteMarkdownAppend, pasteMarkdownStrip, pasteText, pasteTextAppend, pasteTextStrip}