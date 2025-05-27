// ==UserScript==
// @name         YouTube Enhancer Modular
// @namespace    Johnny Inc Modular
// @version      2.0
// @description  Phiên bản mô-đun hóa của YouTube Enhancer
// @match        *://*.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/YouTubeEnhancerCore.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/RemoveShareIdentifier.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/YouTubePlus.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/PremiumLogo.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/AutoExpandComments.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/DirectDownloader.js
// @require      https://raw.githubusercontent.com/willbelove1/youtube_enhancer_01/refs/heads/main/AdBlock.js
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';
    const core = new YouTubeEnhancerCore();
    //core.registerModule(new YouTubeEnhancerCore());
    core.registerModule(new RemoveShareIdentifierModule());
    core.registerModule(new YouTubePlusModule());
    core.registerModule(new PremiumLogoModule());
    core.registerModule(new AutoExpandCommentsModule());
    core.registerModule(new DirectDownloaderModule());
    core.registerModule(new AdBlockModule());
})();
