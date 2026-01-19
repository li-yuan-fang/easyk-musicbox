import type { LyricLine, LyricTranslation, LyricTranslationTable } from "./types";

export {
    generateTranslateTable
}

const generateTranslateTable = (lyrics : Array<LyricLine>) : LyricTranslationTable => {
    let current : LyricTranslation = {
        plain: 0,
        verbatim: 0,
        kana: 0
    }

    let offset = new Array<LyricTranslation>()
    let self = new Array<LyricTranslation>()

    lyrics.forEach((line) => {
        offset.push({
            plain: current.plain,
            verbatim: current.verbatim,
            kana: current.kana
        })

        let s : LyricTranslation = {
            plain: 0,
            verbatim: 0,
            kana: 0
        }

        if (line.plain && line.plain.length > 0) {
            current.plain += line.plain.length
            s.plain = 0.5 * line.plain.length
        }

        if (line.verbatim && line.verbatim.length > 0) {
            try {
                line.verbatim.forEach((verbatim) => {
                    if (verbatim.kana.length > 0) throw new DOMException()
                })

                current.verbatim++
                s.verbatim = 0.5
            } catch {
                current.kana++
                s.kana = 0.5
            }
        }

        self.push(s)
    })

    return { offset, self }
}