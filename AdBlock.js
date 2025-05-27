class AdBlockModule extends Module {
    constructor() {
        super("adblock", "AdBlock", true);
    }

    run() {
        const cssSelectorArr = [
            "#masthead-ad",
            "ytd-rich-item-renderer.style-scope.ytd-rich-grid-row #content:has(.ytd-display-ad-renderer)",
            ".video-ads.ytp-ad-module",
            "tp-yt-paper-dialog:has(yt-mealbar-promo-renderer)",
            "ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-ads']",
            "#related #player-ads",
            "#related ytd-ad-slot-renderer",
            "ytd-ad-slot-renderer",
            "yt-mealbar-promo-renderer",
            "ytd-popup-container:has(a[href='/premium'])",
            "ad-slot-renderer",
            "ytm-companion-ad-renderer"
        ];

        const style = document.createElement("style");
        style.textContent = cssSelectorArr.map((part) => `${part}{display:none!important}`).join(" ");
        document.head.appendChild(style);

        const nativeTouch = (element) => {
            const touch = new Touch({
                identifier: Date.now(),
                target: element,
                clientX: 12,
                clientY: 34,
                radiusX: 56,
                radiusY: 78,
                rotationAngle: 0,
                force: 1
            });
            element.dispatchEvent(
                new TouchEvent("touchstart", { bubbles: true, cancelable: true, view: window, touches: [touch], targetTouches: [touch], changedTouches: [touch] })
            );
            element.dispatchEvent(
                new TouchEvent("touchend", { bubbles: true, cancelable: true, view: window, touches: [], targetTouches: [], changedTouches: [touch] })
            );
        };

        this.core.setupObserver(document.body, { childList: true, subtree: true }, (mutations) => {
            const video = document.querySelector(".ad-showing video") || document.querySelector("video");
            if (video && video.paused && video.currentTime < 1) {
                video.play();
            }

            const skipButton = document.querySelector(".ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern");
            const shortAdMsg = document.querySelector(".video-ads.ytp-ad-module .ytp-ad-player-overlay, .ytp-ad-button-icon");
            if ((skipButton || shortAdMsg) && !window.location.href.includes("https://m.youtube.com/")) {
                video.muted = true;
            }
            if (skipButton) {
                if (video.currentTime > 0.6) {
                    video.currentTime = video.duration;
                } else {
                    skipButton.click();
                    nativeTouch(skipButton);
                }
            } else if (shortAdMsg) {
                video.currentTime = video.duration;
            }

            document.querySelectorAll("ytd-popup-container a[href='/']").forEach((element) => element.closest("ytd-popup-container")?.remove());
            const backdrop = Array.from(document.querySelectorAll("tp-yt-iron-overlay-backdrop")).find(node => node.style.zIndex === "2201");
            if (backdrop) {
                backdrop.className = "";
                backdrop.removeAttribute("opened");
            }

            mutations.forEach((mutation) => {
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const popup = node.querySelector(".ytd-popup-container > .ytd-popup-container > .ytd-enforcement-message-view-model");
                            if (popup) {
                                popup.parentNode.remove();
                                document.querySelectorAll("tp-yt-iron-overlay-backdrop").forEach((b) => b.remove());
                                if (video && video.paused) {
                                    video.play();
                                }
                            }
                            if (node.tagName.toLowerCase() === "tp-yt-iron-overlay-backdrop") {
                                node.remove();
                                if (video && video.paused) {
                                    video.play();
                                }
                            }
                        }
                    });
                }
            });
        });
    }

    renderConfig(config = {}) {
        return `
            <div class="module-config">
                <p>AdBlock module hiện tại không có tùy chọn cấu hình.</p>
            </div>
        `;
    }

    bindConfigEvents() {
        // Không có sự kiện vì không có tùy chọn cấu hình
    }
}
