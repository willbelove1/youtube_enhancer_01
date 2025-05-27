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
// @require      file://./core/YouTubeEnhancerCore.js
// @require      file://./modules/RemoveShareIdentifier.js
// @require      file://./modules/YouTubePlus.js
// @require      file://./modules/PremiumLogo.js
// @require      file://./modules/AutoExpandComments.js
// @require      file://./modules/DirectDownloader.js
// @require      file://./modules/AdBlock.js
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';
    const core = new YouTubeEnhancerCore();
    core.registerModule(new RemoveShareIdentifierModule());
    core.registerModule(new YouTubePlusModule());
    core.registerModule(new PremiumLogoModule());
    core.registerModule(new AutoExpandCommentsModule());
    core.registerModule(new DirectDownloaderModule());
    core.registerModule(new AdBlockModule());
})();