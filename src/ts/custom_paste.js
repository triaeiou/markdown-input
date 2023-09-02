import { EditorView } from './editor';
import { currentOrdinal } from './CodeMirror.extensions/cloze';
let _converter = null;
const platform = 'win';
function _paste(view, format, transform) {
    function objectify(val) {
        return typeof (val) === 'object'
            ? val
            : JSON.parse(val);
    }
    function tr(transform, txt) {
        if (!transform)
            return txt;
        else if (transform === 'strip')
            return txt.replace(/(?:\{\{c\d+::|\}\})/g, '');
        else {
            // Find all ordinals and sort
            const ords = [...new Set(txt.matchAll(/\{\{c(\d+)::/gi))]
                .map((e) => parseInt(e[1]))
                .sort();
            // Map to new ordinals
            let ord = currentOrdinal(view);
            const ords_map = {};
            for (const o of ords)
                ords_map[o] = ++ord;
            // Then find and replace
            return txt.replace(/\{\{c(\d+)::/g, (match, p1) => {
                return `{{c${ords_map[parseInt(p1)]}::`;
            });
        }
    }
    function write_to_dom(txt, pos) {
        // Insert text
        const selection = view.state.selection;
        const trs = [];
        selection.ranges.forEach((rng, n) => {
            trs.push({
                changes: {
                    from: rng.from, to: rng.to,
                    insert: txt
                }
            });
        });
        view.dispatch(...trs);
        // Move cursor to correct position
        view.dispatch({ selection: { anchor: view.state.selection.main.from + pos } });
    }
    console.log("entering _paste");
    bridgeCommand('clipboard-contents', (res) => {
        // Unclear why aqt bridge returns JSON string and QWebChannel returns object
        const contents = objectify(res);
        console.log("got clipboard contents");
        if (contents.html && format === 'md') {
            console.log("getting clipboard html");
            bridgeCommand('clipboard-html', (html) => {
                console.log("got clipboard html: " + html);
                let md = _paste['converter'].html_to_markdown(html);
                if (md) {
                    console.log("converted clipboard html to md: " + md);
                    md = tr(transform, md);
                    console.log("transformed md:" + md);
                    write_to_dom(md, md.length);
                }
            });
        }
        else if (contents.text) {
            console.log("getting clipboard text");
            bridgeCommand('clipboard-text', (txt) => {
                console.log("got clipboard text: " + txt);
                txt = tr(transform, txt);
                console.log("transformed text:" + txt);
                write_to_dom(txt, txt.length);
            });
        }
        else if (contents.image && format === 'md') {
            bridgeCommand('clipboard-image', (img) => {
                if (img)
                    write_to_dom(img, 2);
            });
        }
    });
    return true;
}
const normalize = (kb) => {
    let result, alt, ctrl, shift, meta;
    if (typeof (kb) === 'string') {
        const parts = kb.split(/-(?!$)/);
        result = parts[parts.length - 1];
        if (result == "Space")
            result = " ";
        for (let i = 0; i < parts.length - 1; ++i) {
            const mod = parts[i];
            if (/^(cmd|meta|m)$/i.test(mod))
                meta = true;
            else if (/^a(lt)?$/i.test(mod))
                alt = true;
            else if (/^(c|ctrl|control)$/i.test(mod))
                ctrl = true;
            else if (/^s(hift)?$/i.test(mod))
                shift = true;
            else if (/^mod$/i.test(mod))
                ctrl = true; //platform === "mac" ? meta = true : ctrl = true 
            else
                throw new Error("Unrecognized modifier name: " + mod);
        }
    }
    else if (typeof (kb) === 'object') {
        result = kb.key;
        alt = kb.altKey;
        ctrl = kb.ctrlKey;
        meta = kb.metaKey;
        shift = kb.shiftKey;
    }
    if (alt)
        result = "Alt-" + result;
    if (ctrl)
        result = "Ctrl-" + result;
    if (meta)
        result = "Meta-" + result;
    if (shift)
        result = "Shift-" + result;
    return result;
};
const normalize_keybindings = (kb) => {
    for (const k of Object.keys(kb))
        kb[k] = normalize(kb[k]);
    return kb;
};
const pasteMarkdown = (view) => { return _paste(view, 'md'); };
const pasteMarkdownStrip = (view) => { return _paste(view, 'md', 'strip'); };
const pasteMarkdownAppend = (view) => { return _paste(view, 'md', 'append'); };
const pasteText = (view) => { return _paste(view, 'txt'); };
const pasteTextStrip = (view) => { return _paste(view, 'txt', 'strip'); };
const pasteTextAppend = (view) => { return _paste(view, 'txt', 'append'); };
const customPaste = (converter, key_bindings) => {
    _paste['converter'] = converter;
    key_bindings = normalize_keybindings(key_bindings);
    console.log('parsed bindings ' + JSON.stringify(key_bindings));
    return EditorView.domEventHandlers({
        // Override built-in paste
        paste(event, view) {
            console.log("core paste in custom_paste called");
            return true; // CM-specific, first handler to return true stops further handling
        },
        keydown(e, view) {
            if (!e.key)
                return false;
            const key = normalize(e);
            console.log("custom paste checking " + key + " against " + JSON.stringify(key_bindings));
            if (key in key_bindings) {
                key_bindings[key](view);
                return true; // CM-specific, first handler to return true stops further handling
            }
            return false;
        }
    });
};
export { customPaste, pasteMarkdown, pasteMarkdownAppend, pasteMarkdownStrip, pasteText, pasteTextAppend, pasteTextStrip };
