import json, tempfile
from aqt import mw, gui_hooks, QKeySequence
from aqt.utils import *
from .constants import *
from .utils import get_path
from .bridge import handler

if tmp := re.match(r"^\s*((\d+\.)+\d+)", version_with_build()):
    ANKI_VER = tmp.group(1)
else:
    ANKI_VER = "2.1.0"
_config = {}
tmp_dir = tempfile.TemporaryDirectory()

###########################################################################
def toggle_field(editor: aqt.editor.Editor, name: str, fld: int = None):
    """Toggle current field state"""
    if fld == None:
        fld = editor.currentField if editor.currentField != None else editor.last_field_index
    if fld != None:
        if name == 'markdown':
            editor.web.eval(f'MarkdownInput.toggle({fld});')
        else:
            editor.web.eval(f'MarkdownInput.toggle_rich({fld});')


###########################################################################
def add_srcs(web_content: aqt.webview.WebContent, context: object):
    """Include needed scripts and styles in editor webview header. Called once for the editor"""
    global _config
    if not isinstance(context, aqt.editor.Editor):
        return
    addon = mw.addonManager.addonFromModule(__name__)
    # Defer script to allow bridgeCommand to be defined
    web_content.head += f"""
        <script src="/_addons/{addon}/field.js"></script>
        <link rel=stylesheet href="/_addons/{addon}/mdi.css">
        <link rel=stylesheet href="/_addons/{addon}/{get_path('cm.css')}">
    """

    # Configure Unified and CodeMirror - after script load but before cm instantiation
    web_content.body += f'''
        <script>
            MarkdownInput.init({json.dumps(_config)});
        </script>
    '''

###########################################################################
def bridge(handled: tuple[bool, Any], message: str, context: Any) -> tuple[bool, Any]:
    """
    Bridge to handle pasting by making clipboard content available to JS side.
    If the clipboard contains an image it is inserted in the media collection.
    """
    if res := handler(message):
        return (True, res)
    return handled

"""
Currently not implemented
###########################################################################
def ctx_menu(webview: aqt.webview.AnkiWebView, menu: QMenu):
    def get_sc(name: str):
        for sc in _config[EDITOR][KEYMAP]:
            if sc.get('run', None) == name:
                if key := sc.get('key', None):
                    return QKeySequence(
                        re.sub(
                            'mod',
                            'Ctrl',
                            key.replace('-', '+'),
                            flags=re.IGNORECASE
                        )
                    )
                return None
        return None

    sc = get_sc('pasteMarkdown')
    if sc:
        sc = f' ({sc.toString()})'
    action = menu.addAction(f'Paste Markdown{sc}')

 """

###########################################################################
def init(cfg):
    """Set configuration and hooks"""
    def append_shortcuts(shortcuts, ed):
        shortcuts.append(
            [QKeySequence(cfg[FIELD][SC_TOGGLE]),
            lambda _ed=ed: toggle_field(_ed, 'markdown')]
        )
        shortcuts.append(
            [QKeySequence(cfg[FIELD][SC_RICH]),
            lambda _ed=ed: toggle_field(_ed, 'rich')]
        )
        shortcuts.append(
            [QKeySequence(cfg[FIELD][SC_NEXT]),
           lambda _ed=ed: ed.web.eval('MarkdownInput.cycle_next()')]
        )
        shortcuts.append(
            [QKeySequence(cfg[FIELD][SC_PREV]),
           lambda _ed=ed: ed.web.eval('MarkdownInput.cycle_prev()')]
        )

    global _config
    _config = cfg
    gui_hooks.webview_will_set_content.append(lambda wc, ctx: add_srcs(wc, ctx))
    gui_hooks.editor_will_load_note.append(lambda _js, _note, _ed: _js + r"MarkdownInput.update_all()")
    gui_hooks.editor_did_init_shortcuts.append(append_shortcuts)
    gui_hooks.webview_did_receive_js_message.append(bridge)
