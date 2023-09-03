import {EditorView, keymap, rectangularSelection, crosshairCursor, highlightActiveLine, dropCursor, KeyBinding, ViewPlugin} from "@codemirror/view"
import {EditorState, Transaction, EditorSelection, SelectionRange, Prec, Extension} from "@codemirror/state"
import {indentOnInput, bracketMatching, indentUnit, syntaxHighlighting, LanguageSupport} from "@codemirror/language"
import {languages} from "@codemirror/language-data"
import {defaultKeymap, historyKeymap, indentWithTab, history} from "@codemirror/commands"
import {closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete"
import {highlightSelectionMatches, search} from "search"
import {autocompletion, completionKeymap} from "@codemirror/autocomplete"
import {markdown, markdownKeymap, markdownLanguage} from "@codemirror/lang-markdown"
import {classHighlighter} from '@lezer/highlight'
import {Subscript, Superscript, Strikethrough, Table} from "@lezer/markdown"

import {Underline} from "./CodeMirror.extensions/markdown_extensions"
import {clozeDecorator} from "./CodeMirror.extensions/cloze"

/** CodeMirror instance configuration */

interface Configuration {
  parent: Element
  extensions?: Extension[]
  keymap?: KeyBinding[]
  oninput?: (doc: string) => void
  search?: {
    caseSensitive?: boolean
    regexp?: boolean
    wholeWord?: boolean
  }
}

const lezer_exts = [
  Subscript,
  Superscript,
  Strikethrough,
  Table,
  Underline
]

const ping = (view: EditorView) => {
  console.log("ping!")
  return true
}

class Editor {
  cm: EditorView
  extensions: (Extension|LanguageSupport|ViewPlugin<any>)[]

  constructor(cfg: Configuration) {
    this.extensions = [
      history(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      search({top: true, ...cfg["search"]}),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      syntaxHighlighting(classHighlighter, {fallback: false}),
      clozeDecorator,
      indentUnit.of("    "),
      Prec.highest(
        keymap.of([
          ...cfg.keymap,
          ...closeBracketsKeymap,
          ...markdownKeymap,
          ...defaultKeymap,
          indentWithTab,
          ...historyKeymap,
          ...completionKeymap
        ])
      ),
      EditorView.lineWrapping,
      markdown({base: markdownLanguage, extensions: lezer_exts, codeLanguages: languages}),
      ...cfg.extensions
    ]

    const editor_view = {
      state: EditorState.create({extensions: this.extensions}),
      parent: cfg.parent
    }

    if (cfg.oninput) {
      editor_view['dispatch'] = function(tr: Transaction) {
        const res = this.update([tr])
        if (!tr.changes.empty) cfg.oninput(this.state.doc.toString())
        return res
      }
    }

    this.cm = new EditorView(editor_view)
  }

  set_doc(doc: string, pos: 'start'|'end') {
    this.cm.setState(EditorState.create({
      doc: doc,
      extensions: this.extensions,
      selection: {anchor: pos === 'start' ? 0 : doc.length}
    }))
  }

  get_selections() {
    return this.cm.state.selection.ranges
  }

  set_selections(ranges: readonly SelectionRange[]) {
    this.cm.dispatch({selection: EditorSelection.create(ranges)})
  }
}

export type {Configuration}
export {Editor, EditorView}