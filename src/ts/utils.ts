/** Get closest ancestor matching supplied selector */
function ancestor(descendant: HTMLElement, selector: string) {
    while (descendant && !descendant.matches(selector))
            descendant = descendant.parentElement
    return descendant
}

/** Grow "selection" to first encompassing match and return all within.
 * If no encompassing match is found the result are all matches
 */
function grow(begin: RegExp, end: RegExp, str: string, head: number, tail?: number): {head: {outer: number, inner: number}, tail: {outer: number, inner: number}}[] {
    const stack: [number, number][] = []
    const pairs: {head: {outer: number, inner: number}, tail: {outer: number, inner: number}}[] = []
    let m: RegExpMatchArray
    const re = new RegExp(`(${begin.source})|(${end.source})`, 'g')
    if (tail === undefined) tail = head
    while (m = re.exec(str)) {
        const eindex = m.index + m[0].length
        if (m[1]) {
            stack.push([m.index, eindex])
        } else {
            if (stack.length) {
                const open = stack.pop()
                if (!stack.length && m.index < head) {
                    pairs.length = 0
                    continue
                }
                pairs.push({
                    head: {outer: open[0], inner: open[1]},
                    tail: {outer: eindex, inner: m.index}
                })
                if (open[1] <= head && eindex >= tail) break
            }
        }
    }
    console.log('grow returning ' + JSON.stringify(pairs))
    return pairs
}
/*
function grow(begin: RegExp, end: RegExp, str: string, head: number, tail?: number): {head: {outer: number, inner: number}, tail: {outer: number, inner: number}}|undefined {
    let hout = -1, hin = -1, hopen = 0, m: RegExpMatchArray
    if (tail === undefined) tail = head
    const re = new RegExp(`(${begin.source})|(${end.source})`, 'g')
    while (m = re.exec(str)) {
        const eindex = m.index + m[0].length
        if (m[1]) {
            if (eindex <= tail) {
                hout = m.index
                hin = eindex
                hopen = 1
            }
            else if (!hopen) break
            else hopen++
        } else {
            if (!hopen) {
                if (m.index > tail) break
                continue
            }
            else if (hopen === 1 && m.index >= tail) {
                return {
                    head: {outer: hout, inner: hin},
                    tail: {outer: eindex, inner: m.index}
                }
            }
            hopen--
        }
    }

    return undefined
}
*/

/** Shrink "selection" to all fully contained matches and return those matches */
function shrink(begin: RegExp, end: RegExp, str: string, head?: number, tail?: number): {head: {outer: number, inner: number}, tail: {outer: number, inner: number}}[] {
    if (head === undefined) head = 0
    if (tail === undefined) tail = str.length
    const stack: [number, number][] = []
    const pairs: {head: {outer: number, inner: number}, tail: {outer: number, inner: number}}[] = []    
    const re = new RegExp(`(${begin.source})|(${end.source})`, 'g')
    let m: RegExpMatchArray
    while(m = re.exec(str)) {
        const eindex = m.index + m[0].length
        if (m[1]) {
            if (m.index < head) continue
            if (eindex > tail) break
            stack.push([m.index, eindex])
        } else {
            if (eindex > tail) break
            else if (!stack.length) continue
            const h = stack.pop() as [number, number]
            pairs.push({
                head: {outer: h[0], inner: h[1]},
                tail: {outer: eindex, inner: m.index}
            })
        }
    }

    console.log('shrink returning ' + JSON.stringify(pairs))
    return pairs
}

/*
function shrink(begin: RegExp, end: RegExp, str: string, head?: number, tail?: number): {head: {outer: number, inner: number}, tail: {outer: number, inner: number}}|undefined {
    if (head === undefined) head = 0
    if (tail === undefined) tail = str.length
    const stack: [number, number][] = []
    const pairs: {head: {outer: number, inner: number}, tail: {outer: number, inner: number}}[] = []    
    const re = new RegExp(`(${begin.source})|(${end.source})`, 'g')
    let m: RegExpMatchArray
    while(m = re.exec(str)) {
        const eindex = m.index + m[0].length
        if (m[1]) {
            if (eindex > tail) break
            else if (m.index < head) continue
            stack.push([m.index, eindex])
        } else {
            if (eindex > tail) break
            else if (!stack.length) continue
            const h = stack.pop() as [number, number]
            pairs.push({
                head: {outer: h[0], inner: h[1]},
                tail: {outer: eindex, inner: m.index}
            })
        }
    }

    return pairs.pop()
}
*/

export {ancestor, shrink, grow}