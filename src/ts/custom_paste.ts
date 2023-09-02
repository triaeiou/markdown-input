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

function _paste(view: EditorView, format: 'md'|'txt', transform?: 'strip'|'append') {

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
    console.log("got clipboard contents")

    if (contents.html && format === 'md') {
      console.log("getting clipboard html")
      bridgeCommand('clipboard-html', (html: string) => {
        console.log("got clipboard html: " + html)
        let md = _paste['converter'].html_to_markdown(html)
        if (md) {
          console.log("converted clipboard html to md: " + md)
          md = tr(transform, md)
          console.log("transformed md:" + md)
          write_to_dom(md, md.length)
        }
      })
    } else if (contents.text) {
      console.log("getting clipboard text")
      bridgeCommand('clipboard-text', (txt: string) => {
        console.log("got clipboard text: " + txt)
        txt = tr(transform, txt)
        console.log("transformed text:" + txt)
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

const customPaste = (converter: Converter) => {
  _paste['converter'] = converter
  return []
}

const pasteMarkdown = (view: EditorView) => {return _paste(view, 'md')}
const pasteMarkdownStrip = (view: EditorView) => {return _paste(view, 'md', 'strip')}
const pasteMarkdownAppend = (view: EditorView) => {return _paste(view, 'md', 'append')}
const pasteText = (view: EditorView) => {return _paste(view, 'txt')}
const pasteTextStrip = (view: EditorView) => {return _paste(view, 'txt', 'strip')}
const pasteTextAppend = (view: EditorView) => {return _paste(view, 'txt', 'append')}

/* 
function pasteMarkdown(view: EditorView) {return _paste(view, 'md')}
function pasteMarkdownStrip(view: EditorView) {return _paste(view, 'md', 'strip')}
function pasteMarkdownAppend(view: EditorView) {return _paste(view, 'md', 'append')}
function pasteText(view: EditorView) {return _paste(view, 'txt')}
function pasteTextStrip(view: EditorView) {return _paste(view, 'txt', 'strip')}
function pasteTextAppend(view: EditorView) {return _paste(view, 'txt', 'append')}
*/

export {customPaste, pasteMarkdown, pasteMarkdownAppend, pasteMarkdownStrip, pasteText, pasteTextAppend, pasteTextStrip}