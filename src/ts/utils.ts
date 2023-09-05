/** Get closest ancestor matching supplied selector */
function ancestor(descendant: HTMLElement, selector: string) {
    while (descendant && !descendant.matches(selector))
            descendant = descendant.parentElement
    return descendant
}

/** Grow "selection" to first encompassing match and return all within. */
function grow(begin: RegExp, end: RegExp, str: string, head: number, tail?: number):
    {head: {outer: number, inner: number}, tail: {outer: number, inner: number}}[]
{
    const stack: [number, number][] = []
    const pairs: {head: {outer: number, inner: number}, tail: {outer: number, inner: number}}[] = []
    let m: RegExpMatchArray
    const re = new RegExp(`(${begin.source})|(${end.source})`, 'g')
    if (tail === undefined) tail = head
    while (m = re.exec(str)) {
        const eindex = m.index + m[0].length
        if (m[1]) {
            if (eindex <= head) stack.push([m.index, eindex])
        } else {
            if (stack.length) {
                const open = stack.pop()
                if (!stack.length && m.index < head) {
                    pairs.pop()
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

    return pairs
}

/** Shrink "selection" to all fully contained matches and return those matches */
function shrink(begin: RegExp, end: RegExp, str: string, head?: number, tail?: number):
    {head: {outer: number, inner: number}, tail: {outer: number, inner: number}}[]
{
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

    return pairs
}

export {ancestor, shrink, grow}