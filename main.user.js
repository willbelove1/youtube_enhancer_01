// ==UserScript==
// @name         YouTube Enhancer Modular
// @namespace    Johnny Inc Modular
// @version      2.2
// @description  Phiên bản mô-đun hóa của YouTube Enhancer (Đã sửa lỗi menu)
// @match        *://*.youtube.com/*
// @exclude      *://accounts.youtube.com/*
// @exclude      *://www.youtube.com/live_chat_replay*
// @exclude      *://www.youtube.com/persist_identity*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/YouTubeEnhancerCore.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/RemoveShareIdentifier_refactored.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/YouTubePlus.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/PremiumLogo_refactored.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/AutoExpandComments_refactored.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube-enhancer/refs/heads/main/DirectDownloader_fixed.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/AdBlock_refactored.js
// @license      MIT
// ==/UserScript==

// ========== 🚀 Main ==========
// // Removed redundant GM_registerMenuCommand - Core handles this now
// GM_registerMenuCommand(\⚙️ YouTube Enhancer Settings\', () => {
//     const settingsPanel = document.getElementById("youtube-enhancer-settings");
//     if (settingsPanel) {
//         settingsPanel.classList.remove("hidden");
//     } else {
//         console.warn("[YT Enhancer] Settings UI not available yet.");
//     }
// });

window.addEventListener('load', () => {
    const host = location.hostname;
    const allowedDomains = ['youtube.com', 'www.youtube.com', 'm.youtube.com'];

    if (!allowedDomains.some(d => host === d || host.endsWith('.' + d))) {
        console.log('[YT Enhancer] Host not in allowed domains:', host);
        return;
    }

    if (location.protocol !== 'https:') {
        console.warn('[YT Enhancer] HTTPS required');
        return;
    }

    // Khởi động Enhancer Framework
    const core = new YouTubeEnhancerCore();

    // Register modules using the refactored versions where applicable
    core.registerModule(new RemoveShareIdentifierModule());
    core.registerModule(new YouTubePlusModule());
    core.registerModule(new PremiumLogoModule());
    core.registerModule(new AutoExpandCommentsModule());
    core.registerModule(new DirectDownloaderModule()); // Assumes DirectDownloader_fixed.js is the correct refactored version
    core.registerModule(new AdBlockModule());

    // Initialize the core after registering modules
    core.init();
});


