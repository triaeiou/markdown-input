/**
 * Cloze related functionality
 */
import { Decoration, ViewPlugin } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
const CLOZE = Decoration.mark({
    attributes: { class: "cm-cloze" }
});
const CLOZE_RE = new RegExp(String.raw `(?:{{c\d+::|}})`, 'g');
function _deco(view) {
    let builder = new RangeSetBuilder();
    for (let { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to;) {
            let line = view.state.doc.lineAt(pos);
            for (const match of line.text.matchAll(CLOZE_RE)) {
                builder.add(line.from + match.index, line.from + match.index + match[0].length, CLOZE);
            }
            pos = line.to + 1;
        }
    }
    return builder.finish();
}
const clozeDecorator = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = _deco(view);
    }
    update(update) {
        if (update.docChanged || update.viewportChanged)
            this.decorations = _deco(update.view);
    }
}, {
    decorations: v => v.decorations
});
const CLOZE_ORD_RE = new RegExp(String.raw `{{c(\d+)::`, 'g');
function currentOrdinal(view) {
    let itr = view.state.doc.iter();
    let ord = 0;
    while (!itr.done) {
        if (!itr.lineBreak) {
            let match;
            while ((match = CLOZE_ORD_RE.exec(itr.value)) !== null) {
                const n = parseInt(match[1]);
                if (n > ord)
                    ord = n;
            }
        }
        itr.next();
    }
    return ord;
}
/**
 * Wrap selection(s) in cloze tags
 * @param inc increase ordinal or not
 * @returns
 */
function cloze_selections(view, inc) {
    const selection = view.state.selection;
    let i = currentOrdinal(view);
    const trs = [];
    selection.ranges.forEach((rng, n) => {
        if (inc)
            i++;
        if (rng.empty) {
            trs.push({
                changes: {
                    from: rng.from, to: rng.from,
                    insert: `{{c${i || 1}::}}`
                }
            });
        }
        else {
            trs.push({
                changes: {
                    from: rng.from, to: rng.from,
                    insert: `{{c${i || 1}::`
                }
            }, {
                changes: {
                    from: rng.to, to: rng.to,
                    insert: '}}'
                }
            });
        }
    });
    view.dispatch(...trs);
    const mrng = view.state.selection.main;
    const startl = `\{\{c${i}::`.length;
    view.dispatch({
        selection: {
            anchor: mrng.empty
                ? mrng.from + startl
                : mrng.head > mrng.anchor
                    ? mrng.head + 2
                    : mrng.head - startl
        }
    });
    return true;
}
/** Encloze selection(s) incrementing cloze ordinal */
function clozeNext(view) {
    return cloze_selections(view, true);
}
/** Encloze selection(s) without incrementing cloze ordinal */
function clozeCurrent(view) {
    return cloze_selections(view, false);
}
/** Remove clozes in selections */
function unclozeSelections(view) {
    console.log("uncloze not yet implemented...");
}
export { clozeDecorator, currentOrdinal, clozeNext, clozeCurrent, unclozeSelections };
