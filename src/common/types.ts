
export type {
    LyricLine,
    VerbatimLyricBody,
    VerbatimLyricBase
}

interface LyricLine {
    //起始时间
    time: number;
    //允许带假名的逐字行
    verbatimK?: Array<VerbatimLyricBody>;
    //逐字行
    verbatim?: Array<VerbatimLyricBase>;
    //简易行
    plain?: Array<string>;
}

interface VerbatimLyricBody {
    text: Array<VerbatimLyricBase>;
    kana?: Array<VerbatimLyricBase>;
}

interface VerbatimLyricBase {
    start: number;
    end: number;
    content: number;
}
