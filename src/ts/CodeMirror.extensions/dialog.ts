import { EditorView } from '@codemirror/view'

interface Button {
    text: string
    onclick?: (event: Event) => void
    default?: boolean
}

function dialog(view: EditorView, html: string, buttons: Button[]) {
    let dlg = document.querySelector('.cm-editor .cm-dialog') as HTMLDialogElement
    if (!dlg) {
        dlg = document.createElement('dialog') as HTMLDialogElement
        dlg.classList.add('cm-panels', 'cm-panel', 'cm-dialog')
        dlg.innerHTML = '<div class="cm-dialog-content"></div><div class="cm-dialog-buttons"></div>'
        view.dom.appendChild(dlg)
    }
    dlg.querySelector('.cm-dialog-content').innerHTML = html
    const btns = dlg.querySelector('.cm-dialog-buttons')
    btns.innerHTML = ''
    let focus: HTMLButtonElement
    for (const btn of buttons) {
        const el = document.createElement('button') as HTMLButtonElement
        el.classList.add('cm-button')
        el.innerHTML = btn.text
        el.addEventListener('click', (evt) => {
            dlg.close()
            btn.onclick?.(evt)
        })
        if (btn.default) focus = el
        btns.appendChild(el)
    }
    if (focus) focus.focus()
    dlg.showModal()
}

export type {Button}
export {dialog}
