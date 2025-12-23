import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export function parseReaderContent(htmlString: string, url: string = "https://example.com") {
    try {
        const dom = new JSDOM(htmlString, { url })
        const reader = new Readability(dom.window.document)
        const article = reader.parse()
        return article
    } catch (error) {
        console.error('Reader parsing failed:', error)
        return null
    }
}
