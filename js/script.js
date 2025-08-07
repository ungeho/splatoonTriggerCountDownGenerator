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

    // 入力値のバリデーション
    if (
        !groupName ||
        !triggerWord ||
        isNaN(initialDelay) ||
        isNaN(countSeconds) ||
        isNaN(zoneId) ||
        isNaN(vOffset) ||
        isNaN(fScale)
    ) {
        errorMsg.textContent = "すべての入力欄に正しい値を入力してください。";
        errorMsg.classList.add('visible');
        return;
    } else {
        errorMsg.textContent = "";
        errorMsg.classList.remove('visible');
    }

    // 0.1秒刻み閾値
    const fineThreshold = fineThresholdInput ? parseFloat(fineThresholdInput) : null;

    // カウントダウンの値リスト生成
    let countdownList = [];
    let cur = countSeconds;
    if (!fineThreshold || fineThreshold >= countSeconds) {
        // 全部1秒刻み
        while (cur >= 1) {
            countdownList.push(Number(cur.toFixed(1)));
            cur -= 1.0;
        }
    } else {
        // 1秒刻み（fineThresholdより上の部分）
        while (cur > fineThreshold) {
            countdownList.push(Number(cur.toFixed(1)));
            cur -= 1.0;
        }
        // 0.1秒刻み（fineThresholdから0.1まで）
        cur = Number(cur.toFixed(1));
        while (cur >= 0.1 - 1e-8) {
            countdownList.push(Number(cur.toFixed(1)));
            cur -= 0.1;
            cur = Number(cur.toFixed(1));
        }
    }

    const results = [];
    const fixedOverlayBGColor = 0xC8000000;

    for (let idx = 0; idx < countdownList.length; idx++) {
        const value = countdownList[idx];

        // 色決定
        let overlayTextColor;
        if (value >= 3) {
            overlayTextColor = 0xC800FF00; // 緑
        } else if (value >= 2) {
            overlayTextColor = 0xC800FFFF; // 黄色
        } else {
            overlayTextColor = 0xC80000C8; // 赤
        }

        // 表示時間の長さ（次との差分）
        let duration = 1.0;
        if (!fineThreshold || fineThreshold >= countSeconds) {
            duration = 1.0;
        } else {
            duration = (value > fineThreshold) ? 1.0 : 0.1;
        }
        // 実際は「今の値-次の値」が理想
        if (idx < countdownList.length - 1) {
            duration = countdownList[idx] - countdownList[idx + 1];
            duration = Number(duration.toFixed(1));
        }
        if (duration <= 0) duration = 0.1;

        // 表示開始タイミング
        const matchDelay = parseFloat((initialDelay + (countSeconds - value)).toFixed(1));

        const config = {
            Name: (prefix ? prefix : '') + 'CD' + value,
            Group: groupName,
            ZoneLockH: [zoneId],
            DCond: 5,
            UseTriggers: true,
            Triggers: [
                {
                    Type: 2,
                    Duration: duration,
                    Match: triggerWord,
                    MatchDelay: matchDelay
                }
            ],
            ElementsL: [
                {
                    Name: `${value}`,
                    type: 1,
                    radius: 0.0,
                    Filled: false,
                    fillIntensity: 0.5,
                    overlayBGColor: fixedOverlayBGColor,
                    overlayTextColor: overlayTextColor,
                    overlayVOffset: vOffset,
                    overlayFScale: Number(fScale.toFixed(1)),
                    thicc: 0.0,
                    overlayText: `${value}`,
                    refActorType: 1
                }
            ]
        };

        results.push("~Lv2~" + JSON.stringify(config));
    }

    document.getElementById('output').value = results.join("\n");
}

function copyToClipboard() {
    const text = document.getElementById('output').value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const msg = document.getElementById('copyMsg');
        msg.classList.add('visible');
        setTimeout(() => {
            msg.classList.remove('visible');
        }, 2000);
    }).catch(err => {
        alert("コピーに失敗しました: " + err);
    });
}

document.getElementById('generateBtn').addEventListener('click', generateCountdownConfigs);
document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
