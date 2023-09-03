import { Editor } from "./editor"
import type { EditorView } from "./editor"
import { Converter } from "anki-md-html"
import { customPaste } from "./custom_paste"
import { Configuration, CONVERTER, WINDOW_INPUT, WINDOW_MODE, EDITOR, KEYMAP } from "./constants"
import { parse_config } from "./config"

class WindowEditor {
  editor: Editor
  converter: Converter

  constructor(parent: HTMLElement, cfg: Configuration) {
    Object.assign(this, parse_config(cfg))
    this.converter = new Converter(this[CONVERTER])
    const exts = [
      customPaste(this.converter)
    ]

    this.editor = new Editor({
      parent: parent,
      extensions: exts,
      keymap: this[EDITOR][KEYMAP],
      ...this[EDITOR]
    })
  }

  /**
   * Sets content to the complete doc or just the indexed field depending on config
   * @param fields Array of tuples of field titles & values
   * @param i
   */
  set_html(fields: [[title: string, content: string]], i: number) {
    if (this[WINDOW_INPUT]?.[WINDOW_MODE] === 'note') {
      let html = ''
      for (const [title, content] of fields)
        html += `<!-- ${title} --><br><br>${content}<br><br>`
      this.editor.set_doc(this.converter.html_to_markdown(html), 'start')
    } else
      this.editor.set_doc(this.converter.html_to_markdown(fields[i][1]), 'end')
    this.editor.cm.focus()
  }

  /**
  * Returns array pair for field title and field content for "note" mode,
  * string for field/selection only mode
  */
  get_html() {
    if (this[WINDOW_INPUT]?.[WINDOW_MODE] === 'note') {
      const fields: [title: string, content: string][] = []
      const md = this.editor.cm.state.doc.toString()
      for (const match of md.matchAll(/(.*?)^[ \t]*<!--[ \t]*(.*?)[ \t]*?-->[ \t]*$/gms)) {
        if (fields.length)
          fields[fields.length - 1][1] = this.converter.markdown_to_html(match[1].trim())
        fields.push([match[2], ''])
      }
      return fields
    }
    // else
    return this.converter.markdown_to_html(this.editor.cm.state.doc.toString())
  }
}

export { WindowEditor }
