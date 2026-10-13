/* ==========================================================================
   语言检测系统（二分类）
   规则：输入为中文 → 输出「中文」；其他任意语言 → 统一输出「英文」
   输出仅包含这两种标识，无附加内容。

   判定优先级：
   1) 假名（平假名/片假名/注音）或谚文（韩文字母/音节）出现 → 日语/韩语，非中文 → 英文
   2) 汉字（CJK 统一表意文字及扩展 A、兼容表意文字、部首补充）出现 → 中文
   3) 仅含中文专属标点（全角标点、书名号、破折号等）且无拉丁字母 → 中文
   4) 其余（拉丁、西里尔、阿拉伯、希腊、数字、符号、空串等）→ 英文
   ========================================================================== */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.detectLang = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {

    // 日语假名 / 韩语谚文：只要出现即判定为非中文
    var RE_JA_KO = /[\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af\u1100-\u11ff]/;

    // 汉字：CJK 部首补充、扩展 A、统一表意文字、兼容表意文字
    var RE_CJK = /[\u2e80-\u2fdf\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

    // 中文专属标点（全角逗号句号、书名号、顿号、中文引号等）
    var RE_CN_PUNCT = /[，。！？；：、《》〈〉「」『』【】〔〕（）…—～·￥]/;

    var RE_LATIN = /[A-Za-z]/;

    return function detectLang(text) {
        if (typeof text !== 'string') return '英文';
        var t = text.trim();
        if (!t) return '英文';

        // 1) 含假名或谚文 → 日语/韩语等 → 英文
        if (RE_JA_KO.test(t)) return '英文';

        // 2) 含汉字 → 中文（中英混排以汉字为准）
        if (RE_CJK.test(t)) return '中文';

        // 3) 短文本模糊场景：仅中文标点、无拉丁字母 → 视为中文
        if (RE_CN_PUNCT.test(t) && !RE_LATIN.test(t)) return '中文';

        // 4) 其余一切语言（英/德/法/俄/阿/日罗马字/数字符号等）→ 英文
        return '英文';
    };
});
