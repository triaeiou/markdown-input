import {EditorView} from './editor'
import {Converter} from 'anki-md-html'
import {currentOrdinal} from './CodeMirror.extensions/cloze'
import {popmenu} from './CodeMirror.extensions/input'

/** Anki webview js-py bridge */
declare function bridgeCommand(msg: string): void
/** Anki webview js-py bridge with callback*/
declare function bridgeCommand(msg: string, cb: (txt: string|object) => void): string
/** Data object of what is present in clipboard */
interface Contents {
  html: boolean
  text: boolean
  image: boolean
  media: boolean
}

function _paste(view: EditorView, format: 'md'|'txt'|'raw'|'media'|'audio', transform?: 'strip'|'append') {

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
      for (const o of ords) ords_map[o] ||= ++ord
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

  bridgeCommand('clipboard-contents', (res) => {
    // Unclear why aqt bridge returns JSON string and QWebChannel returns object
    const contents = objectify(res) as Contents

    if (contents.html && format === 'md') {
      bridgeCommand('clipboard-html', (html: string) => {
        let md = _paste['converter'].html_to_markdown(html)
        if (md) {
          md = tr(transform, md)
          write_to_dom(md, md.length)
        }
      })
    } else if (contents.media && ['media', 'audio'].includes(format)) {
      const fn = `fn_${new Date().getTime()}${Math.floor(Math.random() * 10000)}`
      const cmd = `clipboard-${format}: document.${fn}`
      document[fn] = (html: string) => {
        let md = _paste['converter'].html_to_markdown(html)
        if (md) write_to_dom(md, 0) // In second level callback we seem to end up at end already
        delete document[fn]
      }
      bridgeCommand(cmd, (html: string) => {
        // nop - everything in callback
      })
    } else if (contents.text) {
      bridgeCommand(format === 'raw' ? 'clipboard-raw' : 'clipboard-text', (txt: string) => {
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

const customPaste = (converter: Converter) => {
  _paste['converter'] = converter
  return []
}

const pasteMenu = (view: EditorView) => {
  popmenu(
    view,
    [
      {text: 'Paste as Markdown', onclick: (evt) => {pasteMarkdown(view)}, default: true},
      {text: 'Paste as Markdown, strip clozes', onclick: (evt) => {pasteMarkdownStrip(view)}, default: false},
      {text: 'Paste as Markdown, append clozes', onclick: (evt) => {pasteMarkdownAppend(view)}, default: false},
      {text: 'Paste as text', onclick: (evt) => {pasteText(view)}, default: false},
      {text: 'Paste as text, strip clozes', onclick: (evt) => {pasteTextStrip(view)}, default: false},
      {text: 'Paste as text, append clozes', onclick: (evt) => {pasteTextAppend(view)}, default: false},
      {text: 'Paste raw text', onclick: (evt) => {pasteRaw(view)}, default: false},
      {text: 'Paste as media', onclick: (evt) => {pasteMedia(view)}, default: false},
      {text: 'Paste as audio', onclick: (evt) => {pasteAudio(view)}, default: false}
    ]
  )
}

const pasteMarkdown = (view: EditorView) => {return _paste(view, 'md')}
const pasteMarkdownStrip = (view: EditorView) => {return _paste(view, 'md', 'strip')}
const pasteMarkdownAppend = (view: EditorView) => {return _paste(view, 'md', 'append')}
const pasteText = (view: EditorView) => {return _paste(view, 'txt')}
const pasteTextStrip = (view: EditorView) => {return _paste(view, 'txt', 'strip')}
const pasteTextAppend = (view: EditorView) => {return _paste(view, 'txt', 'append')}
const pasteRaw = (view: EditorView) => {return _paste(view, 'raw')}
const pasteMedia = (view: EditorView) => {return _paste(view, 'media')}
const pasteAudio = (view: EditorView) => {return _paste(view, 'audio')}

export {
  customPaste, pasteMenu, pasteMarkdown, pasteMarkdownAppend, pasteMarkdownStrip,
  pasteText, pasteTextAppend, pasteTextStrip, pasteRaw, pasteMedia, pasteAudio
}