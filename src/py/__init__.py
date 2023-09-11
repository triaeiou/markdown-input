from aqt import mw, QPushButton, QMessageBox, gui_hooks

from aqt.utils import *
from . import field, window, browser_sort
from .constants import *
from .version import *

mw.addonManager.setWebExports(__name__, r"(.*(css|js|map))")
config = mw.addonManager.getConfig(__name__)

CVER = get_version()
NVER = "2.2.4"

msgs = []
update_cfg = False

if strvercmp(CVER, '0.0.0') > 0:
    if strvercmp(CVER, '2.2.4') < 0:
        msgs.append('''Options for paste (convert HTML to Markdown or text, amend or strip clozes) have been added. See readme for details and change your configuration as needed, e.g. under `CodeMirror/keymap` add entries such as:<br><code>{
    "key": "Mod-Shift-u",
    "run": "unclozeSelections",
    "preventDefault": true
},{
    "key": "Mod-v",
    "run": "pasteMarkdown",
    "preventDefault": true
},{
    "key": "Mod-shift-v",
    "run": "pasteText",
    "preventDefault": true
},{
    "key": "Alt-shift-v",
    "run": "pasteMarkdownAppend",
    "preventDefault": true
},{
    "key": "Alt-shift-u",
    "run": "pasteMarkdownStrip",
    "preventDefault": true
}
</code>''')

    if strvercmp(CVER, '2.2.3') < 0:
        msgs.append('Option "Browser sort field" has been added. When enabled (default `true`) it will use first `&lt;h1&gt;` tag in note (if it exists) in the "Sort field" column in the browser table (default Anki is unaware of heading tags).')
        if ts := config[CONVERTER].get('Table style'):
            config[CONVERTER].pop('Table style', None)
            config[CONVERTER][TABLES] = ts
            update_cfg = True

    if strvercmp(CVER, '2.2.0') < 0:
        config['Window input'].pop('Selection only', None)
        update_cfg = True

    if strvercmp(CVER, '1.2.0') < 0:
        msgs.append('The configurations "Restore state on toggle", "Hide plain text on toggle" and "Hide rich text on toggle" for "Field input" have been replaced with "Cycle rich text/Markdown" (making the Markdown shortcut either cycle between rich text and Markdown or simply show/hide the Markdown input).')
        msgs.append('"Cloze lists" for "Converter" has been removed.')
        config['Field input'].pop('Restore state on toggle', None)
        config['Field input'].pop('Hide plain text on toggle', None)
        config['Field input'].pop('Hide rich text on toggle', None)
        config['Converter'].pop('Cloze lists', None)
        update_cfg = True

    if strvercmp(CVER, '1.2.2') < 0:
        config.pop('Rich text shortcut', None)
        config.pop('Next field', None)
        config.pop('Previous field', None)
        config.pop('Default field state', None)
        config.pop('Cycle rich text/Markdown', None)
        if config['Field input'].get('Rich text shortcut', None) == None:
            config['Field input']['Rich text shortcut'] = 'Ctrl+Alt+X'
        if config['Field input'].get('Next field', None) == None:
            config['Field input']['Next field'] = 'Ctrl+PgDown'
        if config['Field input'].get('Previous field', None) == None:
            config['Field input']['Previous field'] = 'Ctrl+PgUp'
        if config['Field input'].get('Default field state', None) == None:
            config['Field input']['Default field state'] = 'rich text'
        if config['Field input'].get('Cycle rich text/Markdown', None) == None:
            config['Field input']['Cycle rich text/Markdown'] = True
        update_cfg = True

    if strvercmp(CVER, '2.0.0') < 0:
        msgs.append('The editor DOM and internal functioning which <code>Markdown input</code> depends on changed in Anki version 2.1.56. The current version of <code>Markdown input</code> only ships with 2.1.56+ compatible code. See addon page for details regarding 2.1.55 releases.')
        msgs.append('Due to the changes mentioned above you will likely need to update the CSS for the field input (<code>Field input/CSS</code> in the configuration).')

if update_cfg:
    mw.addonManager.writeConfig(__name__, config)

if strvercmp(CVER, NVER) < 0:
    set_version(NVER)

if len(msgs) > 0:
    msg_box = QMessageBox(mw)
    msg_box.setWindowTitle('Addon "Markdown input" updated')
    msg_box.setText("""<div style="text-align: left;">"Markdown input" addon has been updated:<ul><li>""" + '</li><li>'.join(msgs) + """</li></ul>Please see the addon page (https://ankiweb.net/shared/info/904999275) for more details.</div>""")
    msg_box.addButton(QPushButton('Ok'), QMessageBox.ButtonRole.YesRole)
    msg_box.exec()

if config.get(FIELD) or config.get(CONVERTER):
    field.init(config)

if config.get(WINDOW) or config.get(CONVERTER):
    window.init(config)

if config.get(GENERAL) and config[GENERAL].get(SORT_FIELD):
    gui_hooks.browser_did_change_row.append(browser_sort.clear_cache)
    gui_hooks.browser_did_fetch_row.append(browser_sort.truncate)
