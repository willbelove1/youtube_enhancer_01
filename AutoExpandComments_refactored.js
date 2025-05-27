class AutoExpandCommentsModule extends Module {
    constructor() {
        super("auto-expand-comments", "Auto Expand Comments", true, {
            scrollThrottle: 250,      // ms: How often to check scroll position
            mutationThrottle: 150,    // ms: How often to check for DOM changes
            initialDelay: 1500,       // ms: Delay before starting after page load
            clickInterval: 500,       // ms: Delay between clicks on "more" buttons
            maxRetries: 5,            // Number of times to retry finding comments section
            maxClicksPerBatch: 3,     // Max "more" buttons to click in one go
            scrollThreshold: 0.8      // Percentage of page scrolled to trigger loading
        });
    }

    run() {
        const config = this.core.settings[this.id].config;
        const SELECTORS = {
            COMMENTS: "ytd-comments#comments",
            COMMENTS_SECTION: "ytd-item-section-renderer#sections",
            REPLIES: "ytd-comment-replies-renderer",
            MORE_COMMENTS: "ytd-continuation-item-renderer #button:not([disabled])",
            SHOW_REPLIES: "#more-replies > yt-button-shape > button:not([disabled])",
            HIDDEN_REPLIES: "ytd-comment-replies-renderer ytd-button-renderer#more-replies button:not([disabled])",
            EXPANDED_REPLIES: "div#expander[expanded]",
            COMMENT_THREAD: "ytd-comment-thread-renderer"
        };

        class CommentExpander {
            constructor(core, config) {
                this.core = core;
                this.config = config;
                this.observer = null;
                this.retryCount = 0;
                this.isProcessing = false;
                this.lastScrollTime = 0;
                this.lastMutationTime = 0;
                this.expandedComments = new Set();
                // Use the config value for scroll throttle
                this.scrollHandler = core.throttle(this.handleScroll.bind(this), this.config.scrollThrottle);
            }

            getCommentId(element) {
                const dataContext = element.getAttribute("data-context") || "";
                const timestamp = element.querySelector("#header-author time")?.getAttribute("datetime") || "";
                return `${dataContext}-${timestamp}`;
            }

            isCommentExpanded(element) {
                return this.expandedComments.has(this.getCommentId(element));
            }

            markAsExpanded(element) {
                const commentId = this.getCommentId(element);
                element.classList.add("yt-auto-expanded");
                this.expandedComments.add(commentId);
            }

            isElementClickable(element) {
                if (!element || !element.offsetParent || element.disabled) return false;
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
                    const commentThread = element.closest(SELECTORS.COMMENT_THREAD);
                    if (commentThread && this.isCommentExpanded(commentThread)) continue;
                    if (this.isElementClickable(element)) {
                        element.scrollIntoView({ behavior: "auto", block: "center" });
                        await new Promise((resolve) => setTimeout(resolve, 100)); // Short delay for scroll
                        element.click();
                        if (commentThread) {
                            this.markAsExpanded(commentThread);
                            clickCount++;
                        }
                        // Use config value for click interval
                        await new Promise((resolve) => setTimeout(resolve, this.config.clickInterval));
                    }
                }
                return clickCount > 0;
            }

            async handleScroll() {
                const now = Date.now();
                // Use config value for scroll throttle
                if (now - this.lastScrollTime < this.config.scrollThrottle) return;
                this.lastScrollTime = now;
                // Use config value for scroll threshold
                if ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight > this.config.scrollThreshold) {
                    await this.processVisibleElements();
                }
            }

            async processVisibleElements() {
                if (this.isProcessing) return;
                this.isProcessing = true;
                try {
                    // Use config value for max clicks per batch
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
                    // Use config value for mutation throttle
                    this.core.throttle(async () => {
                        const now = Date.now();
                        if (now - this.lastMutationTime < this.config.mutationThrottle) return;
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
                // Use config value for max retries
                if (this.retryCount >= this.config.maxRetries || !window.location.pathname.startsWith("/watch")) {
                    return;
                }
                if (!document.querySelector(SELECTORS.COMMENTS)) {
                    this.retryCount++;
                    // Use config value for initial delay
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
            // Use config value for initial delay
            document.addEventListener("DOMContentLoaded", () => setTimeout(() => expander.init(), config.initialDelay));
        } else {
            // Use config value for initial delay
            setTimeout(() => expander.init(), config.initialDelay);
        }
    }

    renderConfig(config) {
        // Helper function to create a number input row
        const createInputRow = (key, label, unit, min, step) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <label for="config-${key}" style="flex-basis: 60%;">${label}:</label>
                <input type="number" id="config-${key}" class="config-${key}" value="${config[key]}" min="${min}" step="${step}" style="flex-basis: 30%; text-align: right;">
                <span style="flex-basis: 10%; text-align: left; padding-left: 5px;">${unit}</span>
            </div>`;

        return `
            <div class="module-config" style="font-size: 12px;">
                ${createInputRow("scrollThrottle", "Scroll Check Interval", "ms", 50, 50)}
                ${createInputRow("mutationThrottle", "DOM Check Interval", "ms", 50, 50)}
                ${createInputRow("initialDelay", "Initial Delay", "ms", 0, 100)}
                ${createInputRow("clickInterval", "Click Interval", "ms", 0, 50)}
                ${createInputRow("maxRetries", "Max Retries", "", 0, 1)}
                ${createInputRow("maxClicksPerBatch", "Max Clicks / Batch", "", 1, 1)}
                ${createInputRow("scrollThreshold", "Scroll Threshold", "%", 0.1, 0.05)}
            </div>
        `;
    }

    bindConfigEvents(container, config, onChange) {
        const update = () => {
            const newConfig = {
                scrollThrottle: parseInt(container.querySelector(".config-scrollThrottle").value) || 250,
                mutationThrottle: parseInt(container.querySelector(".config-mutationThrottle").value) || 150,
                initialDelay: parseInt(container.querySelector(".config-initialDelay").value) || 1500,
                clickInterval: parseInt(container.querySelector(".config-clickInterval").value) || 500,
                maxRetries: parseInt(container.querySelector(".config-maxRetries").value) || 5,
                maxClicksPerBatch: parseInt(container.querySelector(".config-maxClicksPerBatch").value) || 3,
                scrollThreshold: parseFloat(container.querySelector(".config-scrollThreshold").value) || 0.8
            };
            // Basic validation
            if (newConfig.scrollThreshold < 0.1) newConfig.scrollThreshold = 0.1;
            if (newConfig.scrollThreshold > 1.0) newConfig.scrollThreshold = 1.0;
            if (newConfig.maxClicksPerBatch < 1) newConfig.maxClicksPerBatch = 1;
            if (newConfig.maxRetries < 0) newConfig.maxRetries = 0;

            onChange(newConfig);
        };

        container.querySelectorAll(".module-config input[type=\"number\"]").forEach((input) => {
            input.removeEventListener("change", update); // Prevent duplicate listeners
            input.addEventListener("change", update);
        });
    }
}

