import { EditorView } from "@codemirror/view"

/** Joint lines in selection(s) (or next line if no selection) */
const joinLines = (view: EditorView) => {
  const selection = view.state.selection
  const text = view.state.doc.toString()
  let dispatched = false
  selection.ranges.forEach((rng, n) => {
    const to = rng.empty ? text.length : rng.to
    const cursor = rng.empty ? rng.from : -1
    const from = rng.empty
      ? text.slice(0, rng.from).lastIndexOf('\n') + 1
      : rng.from
    const tin = text.slice(from, to)
    const tout = rng.empty
      ? tin.replace(/\s*\n[\n\s]*/, ' ')
      : tin.replace(/\s*\n[\n\s]*/g, ' ')
    if (tout !== tin) {
      dispatched = true
      view.dispatch({
        changes: {
          from: from, to: to,
          insert: tout
        }
      })
      if (cursor !== -1)
        view.dispatch({ selection: { anchor: cursor } })
    }
  })

  return dispatched
}

export {joinLines}