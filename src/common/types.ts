
export type {
    LyricLine,
    VerbatimLyric,
    Kana
}

interface LyricLine {
    //起始时间
    time: number;
    //允许带假名的逐字行
    verbatimK?: Array<VerbatimLyric>;
    //逐字行
    verbatim?: Array<VerbatimLyric>;
    //简易行
    plain?: Array<string>;
}

interface VerbatimLyric {
    start: number;
    end: number;
    content: string;
    kana?: Array<Kana>;
}

interface Kana {
    start: number;
    end: number;
    content: number;
}
