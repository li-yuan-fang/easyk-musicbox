
export type {
    LyricLine,
    VerbatimLyric,
    Kana,
    LyricTranslation,
    LyricTranslationTable
}

interface LyricLine {
    time: number;
    verbatim?: Array<VerbatimLyric>;
    plain?: Array<string>;
}

interface VerbatimLyric {
    start: number;
    end: number;
    content: string;
    kana: Array<Kana>;
}

interface Kana {
    start: number;
    end: number;
    content: number;
}

interface LyricTranslationTable {
    offset: Array<LyricTranslation>;
    self: Array<LyricTranslation>;
}

interface LyricTranslation {
    plain: number;
    verbatim: number;
    kana: number;
}
