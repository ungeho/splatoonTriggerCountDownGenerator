function generateCountdownConfigs() {
    const groupName = document.getElementById('groupName').value.trim();
    const triggerWord = document.getElementById('triggerWord').value.trim();
    const initialDelay = parseFloat(document.getElementById('initialDelay').value);
    const countSeconds = parseInt(document.getElementById('countSeconds').value);
    const zoneId = parseInt(document.getElementById('zoneId').value);
    const vOffset = parseFloat(document.getElementById('vOffset').value);
    const fScale = parseFloat(document.getElementById('fScale').value);
    const errorMsg = document.getElementById('errorMsg');

    if (!groupName || !triggerWord || isNaN(initialDelay) || isNaN(countSeconds) || isNaN(zoneId) || isNaN(vOffset) || isNaN(fScale)) {
        errorMsg.textContent = "すべての入力欄に正しい値を入力してください。";
        errorMsg.classList.add('visible');
        return;
    } else {
        errorMsg.textContent = "";
        errorMsg.classList.remove('visible');
    }

    const results = [];
    const fixedOverlayBGColor = 0xC8000000; // 黒背景・不透明度200

    function toFixedNumber(n) {
        return parseFloat(n).toFixed(1);
    }

    for (let i = countSeconds; i >= 1; i--) {
        let overlayTextColor;
        if (i >= 3) {
            overlayTextColor = 0xC800FF00; // 緑
        } else if (i === 2) {
            overlayTextColor = 0xC800FFFF; // 黄色
        } else {
            overlayTextColor = 0xC80000C8; // 赤
        }


        const config = {
            Name: `CD${i}`,
            Group: groupName,
            ZoneLockH: [zoneId],
            DCond: 5,
            UseTriggers: true,
            Triggers: [
                {
                    Type: 2,
                    Duration: parseFloat(toFixedNumber(1.0)),
                    Match: triggerWord,
                    MatchDelay: parseFloat(toFixedNumber(initialDelay + (countSeconds - i)))
                }
            ],
            ElementsL: [
                {
                    Name: `${i}`,
                    type: 1,
                    radius: parseFloat(toFixedNumber(0.0)),
                    Filled: false,
                    fillIntensity: 0.5,
                    overlayBGColor: fixedOverlayBGColor,
                    overlayTextColor: overlayTextColor,
                    overlayVOffset: vOffset,
                    overlayFScale: parseFloat(toFixedNumber(fScale)),
                    thicc: parseFloat(toFixedNumber(0.0)),
                    overlayText: `${i}`,
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
