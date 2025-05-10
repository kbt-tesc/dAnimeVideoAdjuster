const VIDEO_WRAPPER_SELECTOR = '.videoWrapper #video';
const VIDEO_TAG_SELECTOR = '.videoWrapper video';
const SETTINGS_KEY = 'dAnimeVideoPosition';
const TARGET_INSERT_SELECTOR = 'div.setting.mainButton';

// "Middle" ポジションに戻すためのデフォルトスタイル
const originalStyles = {
    videoWrapper: {
        position: 'absolute', top: '0px', right: '0px', bottom: '0px', left: '0px', width: '100%', height: '100%'
    },
    videoTag: {
        display: 'inline-block', verticalAlign: 'baseline', position: 'absolute', top: '0px', bottom: '0px', left: '0px', width: '100%', height: '100%', border: '0px', zIndex: '0'
    }
};

function applyStyles(position) {
    const videoWrapperEl = document.querySelector(VIDEO_WRAPPER_SELECTOR);
    const videoTagEl = document.querySelector(VIDEO_TAG_SELECTOR);

    if (!videoWrapperEl || !videoTagEl) {
        console.warn('dAnimeVideoHelper: スタイル設定用のビデオ要素が見つかりません。');
        return;
    }

    // 元のスタイルにリセット
    Object.keys(originalStyles.videoWrapper).forEach(key => {
        videoWrapperEl.style[key] = originalStyles.videoWrapper[key];
    });
    Object.keys(originalStyles.videoTag).forEach(key => {
        videoTagEl.style[key] = originalStyles.videoTag[key];
    });

    // スタイルを上書き
    switch (position) {
        case 'top':
            videoWrapperEl.style.setProperty('height', 'auto', 'important');

            videoTagEl.style.setProperty('top', '0px', 'important');
            videoTagEl.style.setProperty('bottom', '0px', 'important');
            videoTagEl.style.setProperty('height', 'auto', 'important');
            break;
        case 'middle':
            break;
        case 'bottom':
            videoWrapperEl.style.setProperty('height', 'auto', 'important');

            videoTagEl.style.setProperty('top', 'auto', 'important');
            videoTagEl.style.setProperty('bottom', '0px', 'important');
            videoTagEl.style.setProperty('height', 'auto', 'important');
            break;
    }
    updateUIPopup(position);
}

function saveSetting(position) {
    chrome.storage.local.set({ [SETTINGS_KEY]: position });
}

function loadSettingAndApply() {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
        const savedPosition = result[SETTINGS_KEY];
        if (savedPosition && ['top', 'middle', 'bottom'].includes(savedPosition)) {
            applyStyles(savedPosition);
        } else {
            // 有効な設定が保存されていない場合は、デフォルトの "middle" を適用
            applyStyles('middle');
        }
    });
}

function updateUIPopup(selectedPosition) {
    const positions = ['top', 'middle', 'bottom'];
    positions.forEach(pos => {
        const el = document.getElementById(`dAnimeHelper-${pos}Button`);
        if (el) {
            if (pos === selectedPosition) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        }
    });
}

function initializeExtension() {
    const targetElement = document.querySelector(TARGET_INSERT_SELECTOR);
    if (!targetElement || document.getElementById('dAnimeHelper-toggleButton')) {
        if(!targetElement) console.log("dAnimeVideoHelper: ボタン挿入用のターゲット要素が見つかりません。");
        return;
    }
    console.log("dAnimeVideoHelper: ターゲット要素が見つかりました。UIを初期化します。");

    const controlHtml = `
        <div class="dAnimeVideoHelperExtensionButton">
          <button id="dAnimeHelper-toggleButton" aria-label="ビデオ位置設定" title="ビデオ位置設定">調整</button>
          <div class="dAnimeVideoHelperExtensionPopupMenu" id="dAnimeHelper-popupMenu">
            <div class="dAnimeVideoHelperExtensionVideoLine">
              <div id="dAnimeHelper-topButton" class="dAnimeVideoHelperExtensionPopupItem" data-position="top">
                <span>上</span>
              </div>
              <div id="dAnimeHelper-middleButton" class="dAnimeVideoHelperExtensionPopupItem" data-position="middle">
                <span>中</span>
              </div>
              <div id="dAnimeHelper-bottomButton" class="dAnimeVideoHelperExtensionPopupItem" data-position="bottom">
                <span>下</span>
              </div>
            </div>
          </div>
        </div>
    `;

    targetElement.insertAdjacentHTML('afterend', controlHtml);

    const styles = `
        .dAnimeVideoHelperExtensionButton { position: relative; display: inline-flex; align-items: center; margin-left: 8px; }
        #dAnimeHelper-toggleButton {
            background-color: rgba(0,0,0,0.5); color: white; border: 1px solid rgba(255,255,255,0.7);
            padding: 4px 8px; cursor: pointer; border-radius: 3px; font-size: 12px; line-height: 1.5;
        }
        #dAnimeHelper-toggleButton:hover { background-color: rgba(0,0,0,0.7); }
        .dAnimeVideoHelperExtensionPopupMenu {
            display: none; position: absolute; bottom: calc(100% + 5px);
            left: 50%; transform: translateX(-50%);
            background-color: rgba(50,50,50,0.9); border: 1px solid rgba(200,200,200,0.5);
            border-radius: 3px; z-index: 10000; min-width: 60px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .dAnimeVideoHelperExtensionPopupMenu.active { display: block; }
        .dAnimeVideoHelperExtensionPopupItem {
            padding: 6px 10px; cursor: pointer; color: white; text-align: center; font-size: 12px;
        }
        .dAnimeVideoHelperExtensionPopupItem:hover { background-color: rgba(80,80,80,0.9); }
        .dAnimeVideoHelperExtensionPopupItem.selected { background-color: rgba(0,120,255,0.8); color: white; font-weight: bold; }
        .dAnimeVideoHelperExtensionPopupItem.selected:hover { background-color: rgba(0,100,220,0.9); }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    const toggleButton = document.getElementById('dAnimeHelper-toggleButton');
    const popupMenu = document.getElementById('dAnimeHelper-popupMenu');

    toggleButton.addEventListener('click', (event) => {
        event.stopPropagation();
        popupMenu.classList.toggle('active');
    });

    document.addEventListener('click', (event) => {
        if (!popupMenu.contains(event.target) && !toggleButton.contains(event.target)) {
            popupMenu.classList.remove('active');
        }
    });

    ['top', 'middle', 'bottom'].forEach(pos => {
        const button = document.getElementById(`dAnimeHelper-${pos}Button`);
        button.addEventListener('click', () => {
            applyStyles(pos);
            saveSetting(pos);
        });
    });

    loadSettingAndApply();
}

// MutationObserverで挿入用のターゲット要素の検出
const observer = new MutationObserver((mutationsList, obs) => {
    if (document.querySelector(TARGET_INSERT_SELECTOR) && !document.getElementById('dAnimeHelper-toggleButton')) {
        console.log(`dAnimeVideoHelper: ${TARGET_INSERT_SELECTOR} を検出したので初期化。`);
        initializeExtension();
        obs.disconnect();
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// 要素が既に存在する場合の初期チェック
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("dAnimeVideoHelper: ドキュメントは既にロードされています。初期初期化を試みます。");
    initializeExtension();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("dAnimeVideoHelper: DOMContentLoaded。初期初期化を試みます。");
        initializeExtension();
    });
}