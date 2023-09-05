import { EditorView } from "@codemirror/view"

interface ButtonAction {
    id: string
    onclick?: (event: Event) => void
    default?: boolean
}

class Dialog {
    view: EditorView
    html: string
    btns: ButtonAction[]
    dom?: HTMLElement

    constructor (view: EditorView, html: string, buttons: ButtonAction[]) {
        this.view = view
        this.html = html
        this.btns = buttons
    }

    keyhandler(evt: KeyboardEvent) {
        if (evt.key === 'Escape' && !(evt.shiftKey || evt.altKey || evt.ctrlKey || evt.metaKey)) {
            this.close()
            return true
        }            
        return false
    }

    show() {
        this.dom = document.createElement('div')
        this.dom.style.cssText = 'position: absolut; top: 0; left: 0; width: 100%; height: 100%; background-color: transparent; display: flex;'
        const widget = document.createElement('div')
        widget.style.cssText = 'margin: auto;'
        widget.innerHTML = this.html
        this.dom.appendChild(widget)
        for (const btn of this.btns) {
            widget.querySelector(`#${btn.id}`)?.addEventListener('click', (evt) => {
                this.close()
                if (btn.onclick) btn.onclick(evt)
            })
        }
        this.dom = this.view.dom.parentElement.appendChild(this.dom)
        //this.dom = document.body.appendChild(this.dom)
        for (const btn of this.btns) {
            if(btn.default) {
                (this.dom.querySelector(`#${btn.id}`) as HTMLElement).focus()
                break
            }
        }
        this.dom.addEventListener('keydown', this.keyhandler)
    }

    close() {
        this.dom.removeEventListener('keydown', this.keyhandler)
        this.view.dom.parentElement.removeChild(this.dom)
    }
}

export type {ButtonAction}
export {Dialog}
