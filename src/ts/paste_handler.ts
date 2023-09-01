import {Converter} from "anki-md-html"
import type {Callback} from "./CodeMirror.extensions/custom_paste"

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
function paste_handler(
  converter: Converter,
  default_paste: 'text'|'markdown',
  callback: Callback,
  alt: boolean
) {
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

  bridgeCommand('clipboard-contents', (res) => {
    // Unclear why aqt bridge returns JSON string and QWebChannel returns object
    const contents = objectify(res) as Contents

    if (((default_paste === 'markdown') !== alt) && contents.html) {
      bridgeCommand('clipboard-html', (html: string) => {
        const md = converter.html_to_markdown(html)
        if (md) callback({text: md, pos: md.length})
      })
    } else if (contents.text) {
      bridgeCommand('clipboard-text', (txt: string) => {
        callback({text: txt, pos: txt.length})
      })
    } else if (contents.image) {
      bridgeCommand('clipboard-image', (img: string) => {
        // Alternate paste with image does nothing
        if (img && !alt) callback({text: img, pos: img.length})
      })
    }
  })
}

export {paste_handler}