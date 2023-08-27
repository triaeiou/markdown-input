import {Converter} from "anki-md-html"
import type { Result, Callback, Handler } from "./CodeMirror.extensions/custom_paste"

/** Anki webview js-py bridge */
declare function bridgeCommand(msg: string): void
/** Anki webview js-py bridge with callback*/
declare function bridgeCommand(msg: string, cb: (txt: string) => void): string

/** Wrap bridgeCommand callback in awaitable promise */
function bridge_promise(): Promise<string> {
  return new Promise((resolve) => {
    bridgeCommand("clipboard_image_to_markdown", (md) => {
      resolve(md)
    })    
  })
}

/** Custom paste handler  */
function paste_handler(
  clipboard: DataTransfer,
  callback: Callback,
  converter: Converter,
  html: boolean,
  image: boolean
) {
  // Check if HTML
  let clip: string
  if (html && (clip = clipboard?.getData('text/html'))) {
    let md = converter.html_to_markdown(clip)
    if (md) {
      md = md.replace(/^\s*<!--StartFragment-->\s*(.*?)\s*<!--EndFragment-->\s*$/si, '$1')
      callback({markdown: md, pos: md.length})
    }
  } else if (clip = clipboard.getData('text/plain')) {
    callback({markdown: clip, pos: clip.length})
  } else if (image) {
    // Check if image
    bridgeCommand("clipboard_image_to_markdown", (md) => {
      if (md) callback({markdown: md, pos: 2})
    })
  }
}

export {paste_handler}