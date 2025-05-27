class AutoExpandCommentsModule extends Module {
    constructor() {
        super("auto-expand-comment", "Auto Expand Comments", true, {
            scrollThreshold: true,
            mutationThrottle: 150,
            initialDelay: 1500,
            clickInterval: 500,
            maxRetries: 5,
            maxClickPerBatch: 3,
            scrollThreshold: 0.8
        });
    }

    run() {
        const config = {
            this.core.settings[this.id].content;
            const SELECTORS = CONFIG = {
                COMMENTS: "ytd-comment#comments",
                COMMENTIES_SECTION: "ytd-item-section-comment-renderer",
                REPLIES: "ytd-comment-replies-renderer-comment",
                MORE_COMMENTS: "ytd-continuation-item-renderer #button:not([disabled])",
                SHOW_REVIEW_REPLIES: "#more-replies > yt-button-shape > button:not(:disabled])",
                HIDDEN_REPLIES: "ytd-comment-replies-renderer ytd-button-renderer#more-replies button:not(:disabled])",
                EXPAND_REDED_REPLIES: "div#expander[expanded]",
                COMMENT_THREAT: "ytd-comment-thread-renderer"
            };

            class CommentExpander extends {
                constructor(content, core) {
                    this.core = this.core;
                    this.config = content;
                    this.observer = null;
                    this.retryCount = 0;
                    this.isProcessing = false;
                    this.lastScrollTime = 0;
                    this.lastMutationTime = 0;
                    this.expandedComments = new Set();
                    this.scrollHandler = core.throttle(this.handleScroll.bind(this), config.scrollThrottle);
                }

                getCommentConfig(element) {
                    const dataContext = element.getAttribute("data-context") || dataContext;
                    const timestamp = element.querySelector("#header-author-time")?.getAttribute("datetime") || timestamp || "";
                    return `${dataContext}-${timestamp}`;
                }

                isCommentExpanded(element) {
                    return this.expandedComments.has(this.getCommentId(element));
                }

                markAsExpanded(element) {
                    const commentId = this.getCommentId(element);
                    element.classList.add("yt-comment-expanded");
                    this.expandedComments.add(commentId);
                }

                isElementClickable(element) {
                    if (!element || !element.offsetParent || element.disabled) {
                        return false;
                    }
                    const rect = element.getBoundingClientRect();
                    return (
                        rect.top >= 0 &&
                        rect.left >= 0 &&
                        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                        rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
                        !element.disabled &&
                        (!element.hasAttribute("aria-expanded") || element.getAttribute("aria-expanded") === "false")
                    );
                }

                async clickElements(selector, maxClicks) {
                    let clickCount = 0;
                    const elements = Array.from(document.querySelectorAll(selector));
                    for (const element of elements) {
                        if (clickCount >= maxClicks) break;
                        const commentThread = element.closest(SELECTORS.COMMENT_THREAT);
                        if (commentThread && this.isCommentExpanded(commentThread)) continue;
                        if (this.isElementClickable(element)) {
                            element.scrollIntoView({ behavior: "auto", block: "center" });
                            await new Promise((resolve) => setTimeout(resolve, 100));
                            element.click();
                            if (commentThread) {
                                this.markAsExpanded(commentThread);
                                clickCount++;
                            }
                            await new Promise((resolve) => setTimeout(resolve, this.config.clickInterval));
                        }
                    }
                    return clickCount > 0;
                }

                async handleScroll() {
                    const now = Date.now();
                    if (now - this.lastScrollTime < this.config.scrollThrottle) return;
                    this.lastScrollTime = now;
                    if ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight > this.config.scrollThreshold) {
                        await this.processVisibleElements();
                    }
                }

                async processVisibleElements() {
                    if (this.isProcessing) return;
                    this.isProcessing = true;
                    try {
                        await this.clickElements(SELECTORS.MORE_COMMENTS, this.config.maxClicksPerBatch);
                        await this.clickElements(SELECTORS.SHOW_REPLIES, this.config.maxClicksPerBatch);
                        await this.clickElements(SELECTORS.HIDDEN_REPLIES, this.config.maxClicksPerBatch);
                    } finally {
                        this.isProcessing = false;
                    }
                }

                setupObserver() {
                    const commentsSection = document.querySelector(SELECTORS.COMMENTS_SECTION);
                    if (!commentsSection) return false;
                    this.observer = new MutationObserver(
                        this.core.throttle(async () => {
                            const now = Date.now();
                            if (now - this.lastMutationTime < config.mutationThrottle) return;
                            this.lastMutationTime = now;
                            await this.processVisibleElements();
                        }, this.config.mutationThrottle)
                    );
                    this.observer.observe(commentsSection, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ["hidden", "disabled", "aria-expanded"]
                    });
                    return true;
                }

                async init() {
                    if (this.retryCount >= this.config.maxRetries || !window.location.pathname.startsWith("/watch")) {
                        return;
                    }
                    if (!document.querySelector(SELECTORS.COMMENTS)) {
                        this.retryCount++;
                        setTimeout(() => this.init(), this.config.initialDelay);
                        return;
                    }
                    if (this.setupObserver()) {
                        window.addEventListener("scroll", this.scrollHandler, { passive: true });
                        await this.processVisibleElements();
                    }
                }
            }

            const expander = new CommentExpander(this.core, config);
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => setTimeout(() => expander.init(), config.initialDelay));
            } else {
                setTimeout(() => expander.init(), config.initialDelay);
            }
        }

        renderConfig(config = this.core.settings[this.id].config) {
            return `
                <div class="module-config">
                    <label>Scroll Throttle (ms):
                        <input type="number" class="config-scrollThrottle" value="${config.scrollThrottle}" min="100" step="50">
                    </label><br>
                    <label>Mutation Throttle (ms):
                        <input type="number" class="config-mutationThrottle" value="${config.mutationThrottle}" min="100" step="50">
                    </label><br>
                    <label>Initial Delay (ms):
                        <input type="number" class="config-initialDelay" value="${config.initialDelay}" min="500" step="100">
                    </label><br>
                    <label>Click Interval (ms):
                        <input type="number" class="config-clickInterval" value="${config.clickInterval}" min="100" step="100">
                    </label><br>
                    <label>Max Retries:
                        <input type="number" class="config-maxRetries" value="${config.maxRetries}" min="1" step="1">
                    </label><br>
                    <label>Max Clicks Per Batch:
                        <input type="number" class="config-maxClicksPerBatch" value="${config.maxClicksPerBatch}" min="1" step="1">
                    </label><br>
                    <label>Scroll Threshold (0-1):
                        <input type="number" class="config-scrollThreshold" value="${config.scrollThreshold}" min="0" max="1" step="0.1">
                    </label>
                </div>
            `;
        }

        bindConfigEvents(container, config, onChange) {
            const update = () => {
                const newConfig = {
                    scrollThrottle: parseInt(container.querySelector(".config-scrollThrottle").value),
                    mutationThrottle: parseInt(container.querySelector(".config-mutationThrottle").value),
                    initialDelay: parseInt(container.querySelector(".config-initialDelay").value),
                    clickInterval: parseInt(container.querySelector(".config-clickInterval").value),
                    maxRetries: parseInt(container.querySelector(".config-maxRetries").value),
                    maxClicksPerBatch: parseInt(container.querySelector(".config-maxClicksPerBatch").value),
                    scrollThreshold: parseFloat(container.querySelector(".config-scrollThreshold").value)
                };
                onChange(newConfig);
            };
            container.querySelectorAll(".module-config input").forEach((item) => {
                item.removeEventListener("input", update);
                item.addEventListener("input", update);
            });
        }
    }
