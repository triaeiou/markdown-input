import { EditorView } from '@codemirror/view'

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
    function close(evt) {
        if (evt) {
            evt.preventDefault()
            evt.stopImmediatePropagation()
        }
        try {
            menu?.remove()
            menu = undefined    
        } catch {
            // nop
        } finally {
            view.focus()
        }
    }

    let menu = document.createElement('div') as HTMLDivElement
    menu.classList.add('cm-panels', 'cm-panel', 'cm-popmenu')
    menu.addEventListener('keydown', (evt: KeyboardEvent) => {
        if (evt.key === 'Escape') {
            close(evt)
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
        if (menu && !menu.contains(evt.relatedTarget as Node)) {
            close(evt)
        }
    })

    const itms = document.createElement('div') as HTMLDivElement
    itms.classList.add('cm-popmenu-items')
    menu.appendChild(itms)
    let focus: HTMLButtonElement
    for (const opt of options) {
        const el = document.createElement('button') as HTMLButtonElement
        el.classList.add('cm-popmenu-item')
        el.innerHTML = opt.text
        el.addEventListener('click', (evt) => {
            close(evt)
            opt.onclick?.(evt)
        })
        if (opt.default) focus = el
        itms.appendChild(el)
    }

    const pos = view.coordsAtPos(view.state.selection.main.anchor, 1)
    menu.style.left = pos.left + "px"
    menu.style.top = pos.top + "px"
    view.dom.appendChild(menu);
    (focus || itms.firstElementChild as HTMLButtonElement).focus()
}

export type {Item}
export {dialog, popmenu}
