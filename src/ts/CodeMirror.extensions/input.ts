import { EditorView } from '@codemirror/view'
import { ancestor } from '../utils'

interface Item {
    text: string
    onclick?: (event: Event) => void
    default?: boolean
}

function dialog(view: EditorView, html: string, buttons: Item[]) {
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

function popmenu(view: EditorView, options: Item[]) {
    function hide() {
        menu.hidden = true

        view.focus()
    }

    function show(focus: HTMLButtonElement) {
        const pos = view.coordsAtPos(view.state.selection.main.anchor, 1)
        menu.style.left = pos.left + "px"
        menu.style.top = pos.top + "px"
        menu.hidden = false
        focus.focus()
    }

    let menu = document.querySelector('.cm-editor .cm-popmenu') as HTMLDivElement
    if (!menu) {
        menu = document.createElement('div') as HTMLDivElement
        menu.classList.add('cm-panels', 'cm-panel', 'cm-popmenu')
        menu.innerHTML = '<div class="cm-popmenu-items"></div>'
        menu.addEventListener('keydown', (evt: KeyboardEvent) => {
            if (evt.key === 'Escape') {
                hide()
                evt.preventDefault()
                evt.stopImmediatePropagation()
            } else if (evt.key === 'ArrowDown' || evt.key === 'Tab' && !evt.shiftKey) {
                ((document.activeElement.nextElementSibling || itms.firstElementChild) as HTMLButtonElement)
                .focus()
                evt.preventDefault()
                evt.stopImmediatePropagation()
            } else if (evt.key === 'ArrowUp' || evt.key === 'Tab' && evt.shiftKey) {
                ((document.activeElement.previousElementSibling || itms.lastElementChild) as HTMLButtonElement)
                .focus()
                evt.preventDefault()
                evt.stopImmediatePropagation()
            }
        })
        menu.addEventListener('focusout', (evt: FocusEvent) => {
            if (!menu.contains(evt.relatedTarget as Node)) hide()
        })
        view.dom.appendChild(menu)
    }
    const itms = menu.querySelector('.cm-popmenu-items') as HTMLDivElement
    itms.innerHTML = ''
    let focus: HTMLButtonElement
    for (const opt of options) {
        const el = document.createElement('button') as HTMLButtonElement
        el.classList.add('cm-popmenu-item')
        el.innerHTML = opt.text
        el.addEventListener('click', (evt) => {
            hide()
            opt.onclick?.(evt)
        })
        if (opt.default) focus = el
        itms.appendChild(el)
    }
    show(focus || itms.firstElementChild as HTMLButtonElement)
}

export type {Item}
export {dialog, popmenu}
