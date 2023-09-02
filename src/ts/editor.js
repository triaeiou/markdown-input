import { EditorView, keymap, rectangularSelection, crosshairCursor, highlightActiveLine, dropCursor } from "@codemirror/view";
import { EditorState, EditorSelection, Prec } from "@codemirror/state";
import { indentOnInput, bracketMatching, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, historyKeymap, indentWithTab, history } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { highlightSelectionMatches, search } from "search";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { markdown, markdownKeymap, markdownLanguage } from "@codemirror/lang-markdown";
import { classHighlighter } from '@lezer/highlight';
import { Subscript, Superscript, Strikethrough, Table } from "@lezer/markdown";
import { Underline } from "./CodeMirror.extensions/markdown_extensions";
import { clozeDecorator } from "./CodeMirror.extensions/cloze";
const lezer_exts = [
    Subscript,
    Superscript,
    Strikethrough,
    Table,
    Underline
];
class Editor {
    constructor(cfg) {
        this.extensions = [
            history(),
            dropCursor(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            bracketMatching(),
            closeBrackets(),
            autocompletion(),
            rectangularSelection(),
            search({ top: true, ...cfg["search"] }),
            crosshairCursor(),
            highlightActiveLine(),
            highlightSelectionMatches(),
            syntaxHighlighting(classHighlighter, { fallback: false }),
            clozeDecorator,
            indentUnit.of("    "),
            Prec.highest(keymap.of([
                ...cfg.keymap,
                ...closeBracketsKeymap,
                ...markdownKeymap,
                ...defaultKeymap,
                indentWithTab,
                ...historyKeymap,
                ...completionKeymap
            ])),
            EditorView.lineWrapping,
            markdown({ base: markdownLanguage, extensions: lezer_exts, codeLanguages: languages }),
            ...cfg.extensions
        ];
        const editor_view = {
            state: EditorState.create({ extensions: this.extensions }),
            parent: cfg.parent
        };
        if (cfg.oninput) {
            editor_view['dispatch'] = function (tr) {
                const res = this.update([tr]);
                if (!tr.changes.empty)
                    cfg.oninput(this.state.doc.toString());
                return res;
            };
        }
        this.cm = new EditorView(editor_view);
    }
    set_doc(doc, pos) {
        this.cm.setState(EditorState.create({
            doc: doc,
            extensions: this.extensions,
            selection: { anchor: pos === 'start' ? 0 : doc.length }
        }));
    }
    get_selections() {
        return this.cm.state.selection.ranges;
    }
    set_selections(ranges) {
        this.cm.dispatch({ selection: EditorSelection.create(ranges) });
    }
}
export { Editor, EditorView };
