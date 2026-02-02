/**
 * Markdownの行配列から、指定行における次の見出し番号を自動生成する
 * 例:
 * # Title
 * ## Sub (1.1)
 * ## (target) -> ## 1.2
 */
export function getAutoNumbering(lines: string[], targetLineIndex: number): string | null {
    if (targetLineIndex < 0 || targetLineIndex >= lines.length) return null;
    if (targetLineIndex === 0) return null;

    const targetLine = lines[targetLineIndex];
    // ターゲット行が #, ##, ### ... のみであるかチェック (末尾にスペースがあってもよい)
    // ユーザーが "# " と打った瞬間を想定するので、正規表現は ^(#+)\s*$
    const match = targetLine.match(/^(#+)\s*$/);
    if (!match) return null;

    const level = match[1].length; // #の数 (1-6)
    const counters: number[] = [0, 0, 0, 0, 0, 0]; // h1...h6

    // 1行目からターゲット行の前まで走査
    for (let i = 0; i < targetLineIndex; i++) {
        if (i === 0) continue;
        const line = lines[i];
        // 既存の見出し行を解析 (# 1.1 Title みたいな形式もカウント対象にする)
        const m = line.match(/^(#+)\s/);
        if (m) {
            const l = m[1].length;
            if (l >= 1 && l <= 6) {
                counters[l - 1]++;
                // 下位レベルをリセット
                for (let j = l; j < 6; j++) {
                    counters[j] = 0;
                }
            }
        }
    }

    // ターゲット行のカウンターをインクリメント（現在の文脈での次の番号）
    counters[level - 1]++;

    // 番号文字列生成
    // level=1 (#) -> "1"
    // level=2 (##) -> "1.1" または 親が0なら "1" ?
    // ここでは、上位階層が存在しない場合は "1" として扱い、欠番にはしない。
    // 例: H1がない状態で H2 を書いたら 1.1 になるか？ -> counters[0]は0。
    // ユーザーの要望: ## 1.1 となっているので、親がなくても 1.1 にしたいと思われる。
    // counters[k] が 0 なら 1 にするフォールバックを入れる。

    let numberStr = '';
    for (let k = 0; k < level; k++) {
        const val = counters[k] === 0 ? 1 : counters[k];
        numberStr += (k > 0 ? '.' : '') + val;
    }

    // "# 1.1 " の形式で返す
    // 元の # の数 + スペース + 番号 + スペース
    return `${match[1]} ${numberStr} `;
}
