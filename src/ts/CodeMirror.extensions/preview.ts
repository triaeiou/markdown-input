import { EditorView } from "@codemirror/view"
import { syntaxTree } from "@codemirror/language"
import { dialog } from "./input"

const previewMedia = (view: EditorView) => {
    const selection = view.state.selection
    // Only handle "no selections"
    if (!(selection.ranges.length === 1 && selection.ranges[0].empty))
        return true
    const tree = syntaxTree(view.state)
    const cursor = tree.cursorAt(selection.ranges[0].anchor)
    while (cursor) {
        if (cursor.name === 'Image') {
            cursor.firstChild()
            // @ts-expect-error
            while (cursor.name !== 'URL' && cursor.next()) ;
            const url = `${view.state.doc.slice(cursor.from, cursor.to).toString()}`
            return show(`<img src="${url}">`)
        } else if (cursor.name === 'Link') {
            if (cursor.from >= 6) {
                const prefix = view.state.doc.slice(cursor.from - 6, cursor.from).toString()
                if (prefix === ':audio') {
                    const url = view.state.doc.slice(cursor.from + 1, cursor.to - 1).toString().replace(/^[\\]/, '')
                    return show(`<audio src="${url}" controls autoplay loop></audio>`)
                } else if (prefix === ':video') {
                    const url = view.state.doc.slice(cursor.from + 1, cursor.to - 1).toString().replace(/^[\\]/, '')
                    return show(`<video src="${url}" controls autoplay loop></video>`)    
                }    
            }
            break
        } else if (cursor.name === 'Paragraph') {
            break
        }
        cursor.parent()
    }
    
    return true

    function show(html: string): boolean {
        dialog(view, html, [{ text: 'Ok', default: true }])    
        return true
    }   
}

export {previewMedia}
