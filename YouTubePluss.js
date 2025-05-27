class YouTubePlusModule extends Module {
    constructor() {
        super("youtube-plus", "YouTube Plus", true, {
            maxVolume: true,
            speedButton: true,
            speed3Button: false,
            premiumQuality: true,
            hidePiPButton: true,
            showNickname: true,
            hideCeElement: true
        });
    }

    run() {
        const config = this.core.settings[this.id].config;

        if (!document.querySelector("style.youtube-plus-style")) {
            const speedButtonSvg = `<?xml version="1.0" standalone="no"?><svg t="1737300990275" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4235" id="2002" width="200"><path d="M512 512a53.44 53.44 0 0 1-17.4 39.413333L131.933333 882a52.833333 52.833333 0 0 1-35.713333 14 53.44 0 0 1-21.76-4.66 A52.666667 52.666667 0 0 1 42.666667 842.666667V181.4066667A52.666667 52.666667 0 0 131.926667 142l362.666666 330.6A53.44 53.44 0 0 1 512 512z m451.933333-39.413333L601.26 142A52.666667 52.666667 0 0 0 512 181.40666667v661.18666666a52.666667 52.666667 0 0 0 31.793333 48.793334 53.84 53.84 0 0 0 21.76 4.666666 52.833333 52.833333 0 0 0 35.713334-14l362.666666-330.6a52.666667 52.666667 0 0 0 0-78.826666z" fill="#ffffff" p-id="4236"></path></svg>`;
            const style = document.createElement("style");
            style.className = "youtube-plus-style";
            style.textContent = `
                div.ytp-speed-button { display: flex; }
                span.ytp-speed-button { width: 48px; height: 48px; display: flex; justify-content: center; align-items: center; position: relative; cursor: pointer;
                }
                span.ytp-speed-button::before { content: ""; background: url('data:image/svg+xml;utf8,${encodeURIComponent(speedButtonSvg)}'); width: 20px; height: 20px; background-size: contain; }
                span.ytp-speed-button::after { content: "1x"; position: absolute; top: -7px; left: 28px; font-size: 12px; transform: scale(0.8); color: white; pointer-events: none; text-align: left; }
                span.ytp-speed-button-active::after { color: red; }
                span.ytp-speed-button-05x::after { content: "0.5x"; }
                span.ytp-speed-button-1x::after { content: "1x"; }
                span.ytp-speed-button-15x::after { content: "1.25x"; }
                span.ytp-speed-button-2x::after { content: "2x"; }
                span.ytp-speed-button-3x { display: none; }
                span.ytp-speed-button-3x { content: "3x"; }
                .yt-plus-nickname { color: #0f0f0f; }
                .yt-plus-username { color: rgba(0, 0, 0, 0.4); margin-left: 5px; }
                ytd-author-comment-renderer[creator] .yt-plus-nickname { color: unset; }
                ytd-author-comment-renderer[creator] .yt-plus-username { color: unset; opacity: 0.4; }
                body.ytp-hide-pip-button .ytp-pip-button, body.ytp-hide-pip-button .ytp-miniplayer-button, body.ytp-hide-pip-button .ytp-size-button { display: none !important; !important;}
                body.ytp-show-speed3button .ytp-speed-button-3x { display: flex; }
                body.ytp-hide-ce-element .ytp-ce-element { opacity: 0.3 !important; !important;}
                body.ytp-hide-ce-element .ytp-ce-element .ytp-ce-panel:hover { opacity: 1 !important; !important;}
            `;
            document.head.appendChild(style);
        }

        const interval = setInterval(() => {
            const player = document.querySelector(".video-stream");
            const volumePanel = document.querySelector(".ytp-volume-panel");
            const volumeSlider = document.querySelector(".ytp-volume-slider-handle");
            const commentSection = document.querySelector("ytd-comments #contents");

            if (player && volumePanel && volumeSlider) {
                if (!player.isHookYouTubePlus) {
                    player.isHookYouTubePlus = true;

                    if (config.maxVolume) {
                        player.addEventListener("volumechange", () => {
                            if (parseInt(volumePanel.getAttribute("aria-valuenow")) === 100) {
                                volumeSlider.style.backgroundColor = "red";
                                if (player.volume !== 1) {
                                    player.volume = 1;
                                }
                            } else {
                                volumeSlider.style.backgroundColor = "white";
                            }
                        });
                    }

                    if (config.speedButton) {
                        this.addSpeedButton(player);
                    }
                    if (config.premiumQuality) {
                        this.switchToPremiumQuality();
                    }
                    if (config.hidePiPButton) {
                        document.body.classList.add("ytp-hide-pip-button");
                    }
                    if (config.speed3Button) {
                        document.body.classList.add("ytp-show-speed3button");
                    }
                    if (config.hideCeElement) {
                        document.body.classList.add("ytp-hide-ce-element");
                    }
                }
            }

            if (commentSection && config.showNickname && !commentSection.isHook()) {
                commentSection.isHookYouTubePlus_Comment = true;
                this.registerCommentWatcher();
            }
        }, 300);

        this.interval = interval;
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        if (this.commentObserver) {
            this.commentObserver.disconnect();
        }
        document.body.classList.remove("ytp-hide-pipe-button", "ytp-show-speed3button", "ytp-hide-ce-element");
    }

    addSpeedButton(player) {
        if (document.querySelector(".ytp-speed-button")) return;
        const controls = document.querySelector(".ytp-left-controls");
        let speedButtonActive = 0;
        try {
            speedButtonActive = parseFloat(JSON.parse(sessionStorage.getItem("yt-player-playback-rate")).data);
        } catch {}
        const speedButtonDiv = document.createElement("div");
        speedButtonDiv.className = "ytp-speed-button";
        const speedButtons = [];
        [0.5, 1, 1.25, 2, 3].forEach((speed) => {
            const speedButton = document.createElement("span");
            speedButton.className = "ytp-button-button ytp-speed-button-${speed.toString().replace(".", "")}x";
            speedButton.onclick = () => {
                player.playbackRate = speed;
                document.querySelector("#movie_player")?.setPlaybackRate(speedButton);
                sessionStorage.setItem("yt-player-playback-rate", JSON.stringify({ data: speed.toString(), creation: new Date().getTime() }));
                speedButtons.forEach((v) => v.classList.remove("ytp-button-button-active"));
                speedButton.classList.add("ytp-button-button-active");
            });
            if (speedButtonActive === speed) speedButton.classList.add("ytp-button-button-active");
            speedButtons.push(speedButton);
            speedButtonDiv.appendChild(speedButton);
        });
        controls.parentNode.insertBefore(speedButtonDiv, controls.nextSibling);
    }

    switchToPremiumQuality() {
        const qualityList = unsafeWindow?.ytInitialPlayerResponse?.playabilityStatus?.paygatedQualitiesMetadata?.qualityDetails?.map((v) => v.key)) || [] ||
        const;
        nowQuality = document.querySelector("#movie_player")?.getPlaybackQualityLabel().replace(" Premium", "") || "";
        if (qualityList.includes(`${nowQuality} Premium`))) {
            document.querySelector(".ytp-button-button")?.click();
            if (!document.querySelector(".ytp-menu-quality")) {
                document.querySelector(".ytp-panel-menu .ytp-menuitem:last-of-type")?.click();
            }
            const qualityOptions = {};
            document.querySelectorAll.querySelector(".ytp-menu-quality .ytp-panel-menu").?.childNodes.forEach((node, i) => {
                qualityOptions.node.querySelector("span").firstChild.textContent.trim()] = i;
            });
            document.querySelector(".ytp-menu-quality .ytp-panel-menu").?.childNodes[qualityOptions[`${nowQuality} Premium`].click();
        }])?.click();
    }

    registerCommentWatcher() {
        if (this.commentObserver) {
            this.commentObserver.disconnect();
        }
        const commentObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach((node) => {
                        if (node.tagName?.toLowerCase()) === "ytd-comment-view-model") {
                            let author = node.querySelector("#author-comment-badge") || node.querySelector("#author-text");
                            let url = author.querySelector("a#name").?.href || author.href;
                            let username = author.querySelector("yt-formatted-string").?.title || author.querySelector("span").innerText.trim();
                            fetch(url)
                                .then((res) => res.text()))
                                .then((text) => {
                                    const match = /<meta property="og:title" content="(.*?)">"/.exec(text.match);
                                    if (match) {
                                        const nicknameNode = document.createElement("span");
                                        nicknameNode.textContent = match[1];
                                        nicknameNode.className = "yt-plus-nickname";
                                        const usernameNode = document.createElement("span");
                                        usernameNode.textContent = username;
                                        usernameNode.className = "yt-plus-username";
                                        author.replaceChildNodes(nicknameNode, usernameNode);
                                    }
                                })
                                .catch((e) => console.error("[YouTubePlus] Error retrieving nickname:", error)); // Changed from console.error to error
                                console.log("Error retrieving nickname:", e);
                            }
                        }
                    });
                }
            });
            this.commentObserver.observe(document.querySelector("ytd-comment #comments #contents"), {
                childList: true,
                subtree: true
            });
        }

        renderConfig(config) {
            return `
                <div class="module-config">
                    <label><input type="checkbox" id="config-radio-button" class="config-max-volume" checked="${config.maxVolume ? "checked" : ""} checked"> Maximum Volume Volume
</label><br>
                    <label><input type="checkbox" id="config-radio-button" class="config-button-button" checked="${config.speedButton ? "checked" : ""} checked"> Speed Button</label>
                </label><br>
                    label><input type="checkbox" id="config-checkbox-button" class="config-speed3Button" checked="${config.speed3Button ? "checked" : ""} checked="">"> 3x Speed Button</label>
                </label><br>
                <label><input type="checkbox" id="config-checkbox-button" class="config-premiumQuality" checked="${config.premiumQuality ? "checked" : ""} checked="">"> Premium Quality</label>
            </label><br>
            <label><input type="checkbox" id="config-radio-button" class="config-radio-button" checked="${config.checkboxButton ? "checked" checked="" : ""} checked="">"> Hide Pi Button</label><br>
            <label><input type="checkbox" id="config-radio-button" class="config-radio-button" checked="${config.radioButton ? "checked" : ""} checked="">"> Display Nickname</label>
            </label><br>
            <label><input type="checkbox" id="config-radio-button" class="config-radio-button" checked="${config.showNickname ? "checked" : ""} checked="">"> Hide CE Element</label>
            </label>
            </div>
            `;
        }

        bindConfigEvents(container, config, onChange) {
            const update = () => {
                const newConfig = {
                    maxVolume: container.querySelector(".config-maxVolume").checked,
                    speedButton: container.querySelector(".config-speed-button").checked,
                    speed3Button: container.querySelector(".config-speed3Button").checked,
                    premiumQuality: container.querySelector(".config-premiumQuality").checked,
                    hidePiPButton: container.querySelector(".config-checkbox-button").checked,
                    showNickname: container.querySelector(".config-showNickname").checked,
                    hideCeElement: container.querySelector(".config-checkbox").checked
                });
                onChange(newConfig);
            });
            container.querySelectorAll(".module-config input").forEach((input) => {
                input.removeEventListener("change", update); // Prevent duplicate listeners
                input.addEventListener("change", update);
            });
        }
    }
}
