/**
 * Cloze related functionality
 */
import { EditorView, ViewUpdate, Decoration, DecorationSet, ViewPlugin } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { dialog } from "./input"
import { grow, shrink } from "../utils"
import { syntaxTree } from "@codemirror/language"
import {SyntaxNodeRef} from "@lezer/common"

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
  /** Perform the actual sort */
  function sort(evt: Event) {
    const trs = []
    for (const m of txt.matchAll(/{{c(\d+)::/g)) {
      trs.push({
        changes: {
          from: m.index, to: m.index + m[0].length,
          insert: `{{c${ords[m[1]]}::`
        }
      })
    }
    view.dispatch(...trs)
  }

  // Find all clozes and calculate new ordinals
  const txt = view.state.doc.toString()
  let ord = 0
  const ords = {}

  for (const m of txt.matchAll(/{{c(\d+)::/g)) {
    const n = parseInt(m[1])
    if (!ords[n]) ords[n] = ++ord
  }

  // Ask to sort if clozes are found, calling `sort` on confirmation
  if (Object.keys(ords).length) {
    dialog(
      view,
      '<b>SORT CLOZES?</b><br>Are you sure you want to sort the clozes? Note that this will mess up the scheduling as that will be dependent on the old cloze ordinals.',
      [
        {
          text: 'Sort',
          onclick: sort,
          default: true
        },
        {
          text: 'Cancel'
        }
      ]
    )
  }

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
  const txt = view.state.doc.toString()
  const selection = view.state.selection
  const trs = []
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

function syncClozes(view: EditorView): boolean {
  function sync() {
    const trs = []
    for (const rng of selection.ranges) {
      for (const m of txt.slice(rng.from, rng.to).matchAll(/\{\{c(\d+)::/g)) {
        const i = rng.from + m.index + 3
        trs.push(
          {
            changes: {
              from: i, to: i + m[1].length,
              insert: ord
            }
          }
        )          
      }
    }
    view.dispatch(...trs)  
  }

  const txt = view.state.doc.toString()
  const selection = view.state.selection
  let ord = ''
  for (const rng of selection.ranges) {
    for (const m of txt.slice(rng.from, rng.to).matchAll(/\{\{c(\d+)::/g)) {
      ord = m[1]
      dialog(
        view,
        `<b>SYNC CLOZES?</b><br>Are you sure you want to sync the clozes to ordinal ${ord}? Note that this will keep the scheduling of cloze ${ord}.`,
        [
          {
            text: 'Sync',
            onclick: sync,
            default: true
          },
          {
            text: 'Cancel'
          }
        ]
      ) 
      return true
    }
  }

  return true
}

function autoCloze(view: EditorView): boolean {
  const doc = view.state.doc.toString()
  const tree = syntaxTree(view.state)
  const trs = []

  function cloze(start: number, end: number) {
    let ord = currentOrdinal(view)
    const cursor = tree.cursorAt(start)
    cursor.next(true) // Step into document
    cursor.iterate(enter)

    function enter(nd: SyntaxNodeRef): boolean {
      if (
        [ 'BulletList', 'OrderedList', 'ListItem', 'Table', 'TableRow']
        .includes(cursor.name)
      ) {
        // Recurse into
        return true
      } else if (cursor.name === 'Paragraph') {
        const slice = doc.slice(cursor.from, cursor.to)

        // Special case, dl are paragraphs here
        // Does it look like a dl (last line `:    something`)
        if (/(?<=^|\n):(?:[ ]{1,3}|\t)\S.*$/.test(slice)) {
          for (const m of slice
            // Pattern: start of dd | ` ::` | `:: ` not preceded by `{{c\d+`
            .matchAll(/(?<=^:[ ]{1,3}|\t)(?<start>::)|(?<pre>(?<= )::|(?<post>(?<!{{c\d+)::(?= |$)))/gm)
          ) {
            const from = cursor.from + m.index
            // Special case: dd starts with `::` → remove both colons and no space
            const head = m.groups['start']
              ? `{{c${++ord}::`
              : `: {{c${++ord}::`
            let eat = from + 2
            while ([' ', '\t'].includes(doc[eat])) eat++
            const to = eat + doc.slice(eat).search(/$/m)
            trs.push(
              {changes: {from: from, to: eat, insert: head}},
              {changes: {from: to, to: to, insert: '}}'}}
            )
          }
        } else { // Normal paragraph
          for (const m of slice
            // Pattern: start of line | ` ::` | `:: ` not preceded by `{{c\d+`
            .matchAll(/(?<start>(?<=^)::)|(?<pre>(?<= )::)|(?<post>(?<!{{c\d+)::(?= |$))/gm)
          ) {
            const from = cursor.from + m.index
            const head = m.groups['start']
              ? `{{c${++ord}::`
              : `: {{c${++ord}::`
            let feat = 2
            while ([' ', '\t'].includes(doc[from + feat])) feat++
            let to = doc.slice(from + 2, cursor.to).search(/(?:  |\\)$/m)
            let teat = 0
            let tail = '}}'
            let peek = tree.cursorAt(from) // Can't use copy of reference
            peek.nextSibling()
            if (to > -1) {
              // Single line
              to += from + 2
            } else if (peek.name === 'BulletList' || peek.name === 'OrderedList') {
              console.log(`-------------------------\npeeked ${peek.name}:\n->${doc.slice(peek.from, peek.to)}<-\n\npeek.to: ${peek.to}`)
              // Convoluted indent math as it seem preceding paragraph eats one char from indent
              to = peek.to
              const indent = (peek.from - cursor.to - 1)/3
              if (indent) { // Enclozing nested list
                tail = `\n\n${' '.repeat(indent*4)}}}`
              } else { // Enclozing root list
                while (to + teat <= doc.length && /\s/.test(doc[to + teat])) teat++
                tail = `\n\n}}${to + teat < doc.length ? '  \n' : '  '}`
              }

            } else {
              // Wrap any other cases to paragraph end
              to = cursor.to
            }
            trs.push(
              {changes: {from: from, to: from + feat, insert: head}},
              {changes: {from: to, to: to + teat, insert: tail}}
            )
          } 
        }
      } else if (cursor.name === 'TableCell') {
        const cell = doc.slice(cursor.from, cursor.to)
        let m
        // Cloze entire cell
        if (m = cell.match(/^\s*::\s*(.*?)\s*$/)) {
          trs.push({changes: {
            from: cursor.from,
            to: cursor.to,
            insert: `{{c${++ord}::${m[1]}}}`}
          })
        // Close after `::`
        } else if (m = cell.match(/(?<!{{c\d+)::(?:$|\s+(.*)\s*$)/)) {
          trs.push({changes: {
            from: cursor.from + m.index,
            to: cursor.to,
            insert: `: {{c${++ord}::${m[1]}}}`}
          })  
        }
      }
  
      // No need to recurse further
      return false
    }
  }
  const selection = view.state.selection

  if (selection.ranges.length === 1 && selection.ranges[0].empty)
    cloze(0, doc.length)
  else
    for (const rng of selection.ranges) cloze(rng.from, rng.to)

  // Reverse order → outer cloze before inner → correct placement
  view.dispatch(...trs.reverse())
  return true
}

export {clozeDecorator, currentOrdinal, clozeNext, clozeCurrent, unclozeSelections, sortClozes, syncClozes, autoCloze}