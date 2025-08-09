// ===== ヘルパ =====
function placeholderArrayFromSelection(val) {
    switch (val) {
        case "1-8": return ["<1>", "<2>", "<3>", "<4>", "<5>", "<6>", "<7>", "<8>"];
        case "1": return ["<1>"];
        case "t1t2": return ["<t1>", "<t2>"];
        case "h1h2": return ["<h1>", "<h2>"];
        case "d1d2": return ["<d1>", "<d2>"];
        case "d1d2d3d4": return ["<d1>", "<d2>", "<d3>", "<d4>"];
        case "self":
        default: return null;
    }
}

// JSON 文字列の特定フィールドを小数1桁へ強制
function forceFixed1OnFields(jsonStr, fieldNames) {
    const names = fieldNames
        .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
    const re = new RegExp(`("(?:${names})"\\s*:\\s*)(-?\\d+(?:\\.\\d+)?)(?=\\s*[,}\\]])`, "g");
    return jsonStr.replace(re, (_, head, value) => `${head}${Number(value).toFixed(1)}`);
}

// ===== 本体 =====
function generateCountdownConfigs() {
    const groupName = document.getElementById('groupName').value.trim();
    const triggerWord = document.getElementById('triggerWord').value.trim();
    const initialDelay = parseFloat(document.getElementById('initialDelay').value);
    const countSeconds = parseInt(document.getElementById('countSeconds').value);
    const zoneId = parseInt(document.getElementById('zoneId').value);
    const vOffset = parseFloat(document.getElementById('vOffset').value);
    const fScale = parseFloat(document.getElementById('fScale').value);
    const fineThresholdInput = parseInt(document.getElementById('fineThreshold').value);
    const prefix = document.getElementById('prefix').value.trim();
    const errorMsg = document.getElementById('errorMsg');

    const targetSel = document.getElementById('targetPlaceholder'); // 追加した <select id="targetPlaceholder">
    const selVal = targetSel ? targetSel.value : "self";
    const placeholders = placeholderArrayFromSelection(selVal);
    const isNonSelf = Array.isArray(placeholders) && placeholders.length > 0;

    // 入力チェック
    if (!groupName || !triggerWord ||
        isNaN(initialDelay) || isNaN(countSeconds) || isNaN(zoneId) ||
        isNaN(vOffset) || isNaN(fScale)) {
        errorMsg.textContent = "すべての入力欄に正しい値を入力してください。";
        errorMsg.classList.add('visible');
        return;
    } else {
        errorMsg.textContent = "";
        errorMsg.classList.remove('visible');
    }

    // 0.1秒刻みの閾値
    const fineThreshold = fineThresholdInput ? parseFloat(fineThresholdInput) : null;

    // カウントダウンの値（降順）
    const countdownList = [];
    let cur = countSeconds;
    if (!fineThreshold || fineThreshold >= countSeconds) {
        while (cur >= 1) { countdownList.push(Number(cur.toFixed(1))); cur -= 1.0; }
    } else {
        while (cur > fineThreshold) { countdownList.push(Number(cur.toFixed(1))); cur -= 1.0; }
        cur = Number(cur.toFixed(1));
        while (cur >= 0.1 - 1e-8) {
            countdownList.push(Number(cur.toFixed(1)));
            cur = Number((cur - 0.1).toFixed(1));
        }
    }

    const results = [];
    const overlayBG = 0xC8000000;                // 3355443200
    const GREEN = 0xC800FF00;                    // 3355508480
    const YELLOW = 0xC800FFFF;                   // 3355508735
    const RED = 3355443400;                      // ご希望の赤

    for (let i = 0; i < countdownList.length; i++) {
        const val = countdownList[i];

        // 色
        const overlayTextColor =
            val >= 3 ? GREEN :
                val >= 2 ? YELLOW : RED;

        // 表示時間（今の値 - 次の値）。最後の要素は閾値に応じて 1.0/0.1
        let duration;
        if (i < countdownList.length - 1) {
            duration = Number((countdownList[i] - countdownList[i + 1]).toFixed(1));
            if (duration <= 0) duration = 0.1;
        } else {
            duration = (!fineThreshold || fineThreshold >= countSeconds) ? 1.0 : (val > fineThreshold ? 1.0 : 0.1);
        }

        // トリガーまでの遅延
        const matchDelayRaw = Number((initialDelay + (countSeconds - val)).toFixed(1));
        const trigger = {
            Type: 2,
            Duration: duration,
            Match: triggerWord
            // MatchDelay は後で 0 でなければ付ける
        };
        if (matchDelayRaw !== 0) {
            trigger.MatchDelay = matchDelayRaw;
        }

        // ElementsL 要素（代入順＝出力順）
        const el = {
            Name: `${val}`,
            type: 1,
            radius: 0.0,
            Filled: false,
            fillIntensity: 0.5,
            overlayBGColor: overlayBG,
            overlayTextColor: overlayTextColor,
            overlayVOffset: vOffset,
            overlayFScale: fScale,
            thicc: 0.0,
            overlayText: `${val}`
        };

        if (isNonSelf) {
            el.refActorPlaceholder = placeholders.slice(); // overlayText の直後
        }

        if (!isNonSelf) {
            el.refActorType = 1; // Self のみ
        }

        if (isNonSelf) {
            el.refActorComparisonType = 5; // 最後に
        }

        const config = {
            Name: (prefix ? prefix : '') + 'CD' + val,
            Group: groupName,
            ZoneLockH: [zoneId],
            DCond: 5,
            UseTriggers: true,
            Triggers: [trigger],
            ElementsL: [el]
        };

        // 文字列化 → 小数1桁に揃える（Duration / MatchDelay / radius / overlayVOffset / overlayFScale / thicc）
        let out = JSON.stringify(config);
        out = forceFixed1OnFields(out, [
            "Duration", "MatchDelay",
            "radius", "overlayVOffset", "overlayFScale", "thicc"
        ]);

        results.push("~Lv2~" + out);
    }

    document.getElementById('output').value = results.join("\n");
}

function copyToClipboard() {
    const text = document.getElementById('output').value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const msg = document.getElementById('copyMsg');
        msg.classList.add('visible');
        setTimeout(() => { msg.classList.remove('visible'); }, 2000);
    }).catch(err => {
        alert("コピーに失敗しました: " + err);
    });
}






document.getElementById('generateBtn').addEventListener('click', generateCountdownConfigs);
document.getElementById('copyBtn').addEventListener('click', copyToClipboard);


