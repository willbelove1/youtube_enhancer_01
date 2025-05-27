class YouTubeEnhancerCore {
        constructor() {
            this.modules = new Map();
            this.observers = [];
            this.settings = {};
            this.uiContainer = null;
        }

        // Register a new module
        registerModule(module) {
            this.modules.set(module.id, module);
            this.settings[module.id] = {
                enabled: GM_getValue(`module_${module.id}_enabled`, module.defaultEnabled),
                config: GM_getValue(`module_${module.id}_config`, module.defaultConfig || {})
            };
            module.core = this;
            if (this.settings[module.id].enabled) {
                this.runModule(module.id);
            }
        }

        // Run a module
        runModule(moduleId) {
            const module = this.modules.get(moduleId);
            if (module && this.settings[moduleId].enabled) {
                try {
                    module.run();
                    console.log(`[YouTubeEnhancer] Module ${module.name} started`);
                } catch (e) {
                    console.error(`[YouTubeEnhancer] Error running module ${module.name}:`, e);
                }
            }
        }

        // Toggle module enabled state
        toggleModule(moduleId, enabled) {
            this.settings[moduleId].enabled = enabled;
            GM_setValue(`module_${moduleId}_enabled`, enabled);
            if (enabled) {
                this.runModule(moduleId);
            } else {
                this.modules.get(moduleId)?.stop?.();
            }
            this.renderSettingsUI();
        }

        // Update module config
        updateConfig(moduleId, config) {
            this.settings[moduleId].config = config;
            GM_setValue(`module_${moduleId}_config`, config);
            if (this.settings[moduleId].enabled) {
                this.runModule(moduleId);
            }
            this.renderSettingsUI();
        }

        // Setup DOM observer
        setupObserver(target, config, callback) {
            const observer = new MutationObserver(this.throttle(callback, 150));
            observer.observe(target, config);
            this.observers.push(observer);
        }

        // Throttle function
        throttle(func, limit) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => (inThrottle = false), limit);
                }
            };
        }

        // Ensure UI container exists
        ensureUIContainer() {
            if (!this.uiContainer || !document.body.contains(this.uiContainer)) {
                this.uiContainer = document.createElement("div");
                this.uiContainer.id = "youtube-enhancer-settings";
                this.uiContainer.classList.add("hidden"); // Start hidden
                document.body.appendChild(this.uiContainer);
            }
        }

        // Render Settings UI with event delegation
        renderSettingsUI() {
            this.ensureUIContainer();

            this.uiContainer.innerHTML = `
    <style>
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        #youtube-enhancer-settings {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            max-height: 80vh;
            overflow-y: auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            padding: 16px;
            font-family: Arial, sans-serif;
        }
        #youtube-enhancer-settings.hidden {
            display: none;
        }
        .module-item {
            margin-bottom: 16px;
        }
        .module-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .module-config {
            margin-top: 8px;
            padding-left: 16px;
        }
        .toggle-button {
            cursor: pointer;
        }
        .settings-toggle {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10001;
            background: #007bff;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold">YouTube Enhancer Settings</h2>
                    <button class="toggle-button bg-gray-200 px-2 py-1 rounded" data-action="toggle-ui">X</button>
                </div>
                <div>
                    ${Array.from(this.modules.entries())
                        .map(
                            ([id, module]) => `
                                <div class="module-item" data-module-id="${id}">
                                    <div class="module-header">
                                        <span>${module.name}</span>
                                        <input type="checkbox" class="toggle-button module-toggle" data-module-id="${id}" ${
                                            this.settings[id].enabled ? "checked" : ""
                                        }>
                                    </div>
                                    ${module.renderConfig?.(this.settings[id].config) || ""}
                                </div>
                            `
                        )
                        .join("")}
                </div>
            `;

            // Add a toggle button to show/hide the settings UI
            let toggleButton = document.querySelector("#youtube-enhancer-toggle");
            if (!toggleButton) {
                toggleButton = document.createElement("button");
                toggleButton.id = "youtube-enhancer-toggle";
                toggleButton.className = "settings-toggle";
                toggleButton.textContent = "⚙️ Settings";
                document.body.appendChild(toggleButton);
            }

            // Event delegation for UI interactions
            this.uiContainer.addEventListener("click", (e) => {
                const target = e.target;
                if (target.matches("[data-action='toggle-ui']")) {
                    this.uiContainer.classList.toggle("hidden");
                }
                if (target.matches(".module-toggle")) {
                    const moduleId = target.dataset.moduleId;
                    this.toggleModule(moduleId, target.checked);
                }
            });

            // Bind configuration events for each module
            this.modules.forEach((module, id) => {
                if (module.bindConfigEvents) {
                    module.bindConfigEvents(this.uiContainer, this.settings[id].config, (newConfig) =>
                        this.updateConfig(id, newConfig)
                    );
                }
            });

            // Ensure toggle button has an event listener
            toggleButton.addEventListener("click", () => {
                this.uiContainer.classList.toggle("hidden");
            });
        }

        // Initialize framework
        init() {
            // Register menu command
            GM_registerMenuCommand('⚙️ YouTube Enhancer Settings', () => {
                this.renderSettingsUI();
                this.uiContainer.classList.remove("hidden");
            });

            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => this.start());
            } else {
                this.start();
            }
        }

        // Start framework
        start() {
            this.renderSettingsUI();
            this.modules.forEach((module, id) => {
                if (this.settings[id].enabled) {
                    this.runModule(id);
                }
            });
            console.log("[YouTubeEnhancer] Framework initialized");
        }
    }

class Module {
        constructor(id, name, defaultEnabled = true, defaultConfig = {}) {
            this.id = id;
            this.name = name;
            this.defaultEnabled = defaultEnabled;
            this.defaultConfig = defaultConfig;
            this.core = null;
        }

        run() {}
        stop() {}
        renderConfig() {}
        bindConfigEvents() {}
    }
