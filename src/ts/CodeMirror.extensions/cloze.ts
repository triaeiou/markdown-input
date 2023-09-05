/**
 * Cloze related functionality
 */
import { EditorView, ViewUpdate, Decoration, DecorationSet, ViewPlugin } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { Dialog } from "./dialog"
import { grow, shrink } from "../utils"

const CLOZE = Decoration.mark({
  attributes: {class: "cm-cloze"}
})
const CLOZE_RE = new RegExp(String.raw`(?:{{c\d+::|}})`, 'g')

function _deco(view: EditorView) {
  let builder = new RangeSetBuilder<Decoration>()
  for (let {from, to} of view.visibleRanges) {
    for (let pos = from; pos <= to;) {
      let line = view.state.doc.lineAt(pos)
      for (const match of line.text.matchAll(CLOZE_RE)) {
        builder.add(line.from + match.index, line.from + match.index + match[0].length, CLOZE)
      }
      pos = line.to + 1
    }
  }
  return builder.finish()
}

const clozeDecorator = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = _deco(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged)
      this.decorations = _deco(update.view)
  }
}, {
  decorations: v => v.decorations
})

/** Compiled RE for finding cloze ordinals */
const CLOZE_ORD_RE = new RegExp(String.raw`{{c(\d+)::`, 'g')

/** Return highest ordinal in doc */
function currentOrdinal(view: EditorView): number {
  let itr = view.state.doc.iter()
  let ord = 0

  while (!itr.done) {
    if (!itr.lineBreak) {
      let match: RegExpExecArray
      while ((match = CLOZE_ORD_RE.exec(itr.value)) !== null) {
        const n = parseInt(match[1])
        if (n > ord) ord = n
      }
    }
    itr.next()
  }

  return ord
}

/** Sort document ordinals in ascending order */
function sortClozes(view: EditorView): boolean {

  function sort(evt: Event) {
    let itr = view.state.doc.iter()
    let i = 0
    const ords = {}
  
    while (!itr.done) {
      if (!itr.lineBreak) {
        let match: RegExpExecArray
        while ((match = CLOZE_ORD_RE.exec(itr.value)) !== null) {
          const n = parseInt(match[1])
          if (!ords[n]) ords[n] = ++i
        }
      }
      itr.next()
    }

    itr = view.state.doc.iter()
    const trs = []
    while (!itr.done) {
      if (!itr.lineBreak) {
        let match: RegExpExecArray
        while ((match = CLOZE_ORD_RE.exec(itr.value)) !== null) {
          trs.push({
            changes: {
              from: match.index, to: match[0].length,
              insert: `{{c${ords[parseInt(match[1])]}::`
            }
          })
        }
      }
      itr.next()
    }

    return true
  }
  console.log('sorting clozes...')
  const dlg = new Dialog(
    view,
    '<div><b>SORT CLOZES?</b><br>Are you sure you want to sort the clozes? Note that this will mess up the scheduling as that will be dependent on the old cloze ordinals.<br><div id="ok">Sort</div>&nbsp;<div>Cancel</div></div>',
    [{id: 'ok', onclick: sort, default: true}, {id: 'cancel'}]
  )
  dlg.show()

  return true
}


/**
 * Wrap selection(s) in cloze tags
 * @param inc increase ordinal or not
 * @returns
 */
function cloze_selections(view: EditorView, inc: boolean): boolean {
  const selection = view.state.selection
  let i = currentOrdinal(view)
  const trs = []
  selection.ranges.forEach((rng, n) => {
    if (inc) i++
    if (rng.empty) {
      trs.push({
        changes: {
          from: rng.from, to: rng.from,
          insert: `{{c${i || 1}::}}`
        }
      })
    } else {
      trs.push(
        {
          changes: {
            from: rng.from, to: rng.from,
            insert: `{{c${i || 1}::`
          }
        },
        {
          changes: {
            from: rng.to, to: rng.to,
            insert: '}}'
          }
        }
      )

    }
  })
  view.dispatch(...trs)
  const mrng = view.state.selection.main
  const startl = `\{\{c${i}::`.length
  view.dispatch({
    selection: {
      anchor: mrng.empty
        ? mrng.from + startl
        : mrng.head > mrng.anchor
          ? mrng.head + 2
          : mrng.head - startl
    }
  })
  return true
}
/** Encloze selection(s) incrementing cloze ordinal */
function clozeNext(view: EditorView): boolean {
  return cloze_selections(view, true)
}
/** Encloze selection(s) without incrementing cloze ordinal */
function clozeCurrent(view: EditorView): boolean {
  return cloze_selections(view, false)
}

/** Remove clozes in selections */
function unclozeSelections(view: EditorView): boolean {
  const selection = view.state.selection
  const trs = []
  const txt = view.state.doc.toString()
  let pos = -1
  if (selection.ranges.length === 1 && selection.ranges[0].empty) {
    const r = grow(/\{\{c\d+::/, /\}\}/, txt, selection.ranges[0].head).pop()
    if (r) {
      trs.push({
        changes: {from: r.head.outer, to: r.head.inner, insert: ''}
      },{
        changes: {from: r.tail.inner, to: r.tail.outer, insert: ''}
      })
    }
  } else {
    for (const rng of selection.ranges) {
      for (const r of shrink(/\{\{c\d+::/, /\}\}/, txt, rng.from, rng.to)) {
        trs.push({
            changes: {from: r.head.outer, to: r.head.inner, insert: ''}
          },{
            changes: {from: r.tail.inner, to: r.tail.outer, insert: ''}
        })
        if (pos === -1 && rng === view.state.selection.main) pos = r.head.outer
      }
    }
  }
  view.dispatch(...trs)

  if (pos > -1)
    view.dispatch({
      selection: {
        anchor: pos
      }
    })

  return true
}

export {clozeDecorator, currentOrdinal, clozeNext, clozeCurrent, unclozeSelections, sortClozes}