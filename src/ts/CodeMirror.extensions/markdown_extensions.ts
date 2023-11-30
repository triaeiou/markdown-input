import { HighlightStyle } from '@codemirror/language'
import { Tag, tags } from '@lezer/highlight'
import { MarkdownConfig, InlineContext, DelimiterType, Element } from '@lezer/markdown'

// Declaring some types that aren't exported from the library
export let Punctuation = /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~\xA1\u2010-\u2027]/
try { Punctuation = new RegExp("[\\p{Pc}|\\p{Pd}|\\p{Pe}|\\p{Pf}|\\p{Pi}|\\p{Po}|\\p{Ps}]", "u") } catch (_) {}
const enum Mark { Open = 1, Close = 2 }
class InlineDelimiter {
  constructor(readonly type: DelimiterType,
              readonly from: number,
              readonly to: number,
              public side: Mark) {}
}

// Copied from https://github.com/lezer-parser/markdown/blob/91eb10240cacac3c4c65b812dd8fd3023af8c25c/src/markdown.ts#L1444
// and modified
const UnderlineDelim = {resolve: "Underline", mark: "UnderlineMark"}
const underlineMarkTag = Tag.define()
const underlineTag = Tag.define(underlineMarkTag)
/** Lezer extension to parse `=something here=` as underline */
const Underline: MarkdownConfig = {
  defineNodes: [
    {name: "Underline", style: {'Underline/...': underlineTag}},
    {name: "UnderlineMark", style: underlineMarkTag}
  ],
  parseInline: [{
    name: "Underline",
    parse(cx: InlineContext, next: number, start: number) {
      let pos = start + 1
      if (next != 61 || cx.char(pos) == 61) return -1
      const before = cx.slice(start - 1, start), after = cx.slice(pos, pos + 1)
      const pBefore = Punctuation.test(before), pAfter = Punctuation.test(after)
      const sBefore = /\s|^$/.test(before), sAfter = /\s|^$/.test(after)
      const leftFlanking = !sAfter && (!pAfter || sBefore || pBefore)
      const rightFlanking = !sBefore && (!pBefore || sAfter || pAfter)
      const open = leftFlanking && (!rightFlanking || pBefore)
      const close = rightFlanking && (!leftFlanking || pAfter)
      return cx.addDelimiter(UnderlineDelim, start, pos, open, close)
    },
    before: 'Emphasis'
  }] }

const underlineDecorator = HighlightStyle.define([
  {tag: underlineMarkTag, class: 'tok-meta'},
  {tag: underlineTag, textDecoration: 'underline', class: 'tok-underline'}
])

const AudioDelim = {resolve: "Media", mark: "AudioMark"} //"Audio", mark: "AudioMark"}
const audioMarkTag = Tag.define()
const audioTag = Tag.define(audioMarkTag)
const VideoDelim = {resolve: "Media", mark: "VideoMark"} //"Video", mark: "VideoMark"}
const videoMarkTag = Tag.define()
const videoTag = Tag.define(videoMarkTag)
const Media: MarkdownConfig = {
  defineNodes: [
    {name: "Audio", style: {'Audio/...': audioTag}},
    {name: "AudioMark", style: audioMarkTag},
    {name: "Video", style: {'Audio/...': audioTag}},
    {name: "VideoMark", style: videoMarkTag},
  ],
  parseInline: [{
    name: "Media",
    parse(cx: InlineContext, next: number, start: number) {
      console.log('Media resolver: [' + next + ']' + cx.slice(start + 1, cx.end) + '\n' + '\n----')
      if (next != 58 /* : */) return -1
      const match = cx.slice(start + 1, cx.end).match(/^(audio|video)\[(.*?)\](?:\{.*?\})?/)
      if (!match) return -1
      console.log(`match: ${match[1]}`)
      return cx.addDelimiter(
        match[1] === 'audio' ? AudioDelim : VideoDelim,
        start, start + match[0].length, true, true
      )
    },
    before: 'Emphasis'
  }]
}

const mediaDecorator = HighlightStyle.define([
  {tag: audioMarkTag, class: 'tok-meta'},
  {tag: audioTag, class: 'tok-audio'},
  {tag: videoMarkTag, class: 'tok-meta'},
  {tag: videoTag, class: 'tok-video'}
])

export {Underline, underlineDecorator, Media, mediaDecorator}
