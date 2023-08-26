import { EditorView } from "@codemirror/view"

declare function bridgeCommand(msg: string): void
declare function bridgeCommand(msg: string, cb: (txt: string) => void): string

function _insert(view: EditorView, md: string) {
  const selection = view.state.selection
  const trs: {}[] = []
  selection.ranges.forEach((rng, n) => {
    trs.push({
      changes: {
        from: rng.from, to: rng.to,
        insert: md
      }
    })
  })
  view.dispatch(...trs)
}

export interface Configuration {
  html_to_md: (html: string) => string
}

/**
 * Extension to handle pasting images into editor, adding it to Anki and
 * inserting markdown link
 */
export function ankiPaste(options: Configuration): any {
  return EditorView.domEventHandlers({
    paste(event, view) {
      // Check if HTML
      let clip: string
      if (clip = event.clipboardData?.getData('text/html')) {
        let md = options.html_to_md?.(clip)
        if (!md) return false
        md = md.replace(/^\s*<!--StartFragment-->\s*(.*?)\s*<!--EndFragment-->\s*$/si, '$1')
        // Insert md
        _insert(view, md)
        // Move cursor to end
        view.dispatch({
          selection: {
            anchor: view.state.selection.main.from + md.length
          }
        })
        return true
      } else if (clip = event.clipboardData?.getData('text/plain')) {
        // Insert plain text
        _insert(view, clip)
        // Move cursor to end
        view.dispatch({
          selection: {
            anchor: view.state.selection.main.from + clip.length
          }
        })
        return true
      } else {
        // Check if image
        bridgeCommand("clipboard_image_to_markdown", (md) => {
          if (md) {
            // Insert md
            _insert(view, md)
            // Move cursor to alt text location
            view.dispatch({
              selection: {
                anchor: view.state.selection.main.from + 2
              }
            })
            return true
          }
        })
      }
      return false
    }
  })
}
