import type {EditorView} from "./editor"
import type {Converter} from "anki-md-html"
import type {Callback} from "./CodeMirror.extensions/custom_paste"
import {currentOrdinal} from "./CodeMirror.extensions/cloze"

/** Anki webview js-py bridge */
declare function bridgeCommand(msg: string): void
/** Anki webview js-py bridge with callback*/
declare function bridgeCommand(msg: string, cb: (txt: string|object) => void): string
interface Contents {
  html: boolean
  text: boolean
  image: boolean
}

/**
 * Custom paste handler - uses py side logic through bridge to get clipboard
 * content and insert images in media collection as needed.
 */
function paste_handler(converter: Converter, view: EditorView, func: string, callback: Callback) {
  function objectify(val: string|object): object {
    return typeof(val) === 'object'
      ? val
      : JSON.parse(val)
  }

  function stringify(val: string|object): string {
    return typeof(val) === 'string'
      ? val
      : JSON.stringify(val)
  }

  /** Adjust/remove clozes depending on functionality requested */
  function prepare(func: string, text: string) {
    if (func.includes('strip')) return text.replace(/(?:\{\{c\d+::|\}\})/g, '')
    else if (func.includes('append')) {
      // Find all ordinals and sort
      const ords = [...new Set(text.matchAll(/\{\{c(\d+)::/gi))]
        .map((e) => parseInt(e[1]))
        .sort()

      // Map to new ordinals
      let ord = currentOrdinal(view)
      const ords_map = {}
      for (const o of ords) ords_map[o] = ++ord

      // Then find and replace
      return text.replace(/\{\{c(\d+)::/g, (match, p1) => {
        return `{{c${ords_map[parseInt(p1)]}::`
      })
    }
    return text
  }

  bridgeCommand('clipboard-contents', (res) => {
    // Unclear why aqt bridge returns JSON string and QWebChannel returns object
    const contents = objectify(res) as Contents

    if (func.startsWith('markdown') && contents.html) {
      bridgeCommand('clipboard-html', (html: string) => {
        let md = converter.html_to_markdown(html)
        if (md) {
          md = prepare(func, md)
          callback({text: md, pos: md.length})
        }
      })
    } else if (func.startsWith('text') && contents.text) {
      bridgeCommand('clipboard-text', (txt: string) => {
        txt = prepare(func, txt)
        callback({text: txt, pos: txt.length})
      })
    } else if (contents.image && !func.startsWith('text')) {
      bridgeCommand('clipboard-image', (img: string) => {
        if (img) callback({text: img, pos: img.length})
      })
    }
  })
}

export {paste_handler}