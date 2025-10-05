// ============================================================================
// CONFIG
// ============================================================================
const CONFIG = {
    STORAGE_KEY: 'noteMarkdown',
    LINE_HEIGHT: 1.6 * 16,
    PADDING: 20,
    AUTOSAVE_DELAY: 500
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================
const DOM = {
    trigger: document.querySelector('.trigger'),
    body: document.body,
    preview: document.querySelector('.markdown-preview'),
    input: document.querySelector('.markdown-input')
};

// ============================================================================
// MARKDOWN CONFIG
// ============================================================================
const MarkdownConfig = {
    init() {
        marked.use({
            breaks: true,
            gfm: true,
            renderer: {
                html(html) {
                    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
            }
        });
    }
};

// ============================================================================
// STORAGE MANAGER
// ============================================================================
const Storage = {
    save(content) {
        localStorage.setItem(CONFIG.STORAGE_KEY, content);
    },

    load() {
        return localStorage.getItem(CONFIG.STORAGE_KEY) || '';
    }
};

// ============================================================================
// THEME MANAGER
// ============================================================================
const ThemeManager = {
    init() {
        DOM.trigger.addEventListener('click', () => {
            DOM.body.classList.toggle('dark-mode');
        });
    }
};

// ============================================================================
// SCROLL MANAGER
// ============================================================================
const ScrollManager = {
    centerPosition(yPosition) {
        requestAnimationFrame(() => {
            const targetScroll = yPosition - (window.innerHeight / 2);
            window.scrollTo(0, Math.max(0, targetScroll));
        });
    },

    calculateCursorY(lineNumber) {
        return CONFIG.PADDING + (lineNumber - 1) * CONFIG.LINE_HEIGHT;
    }
};

// ============================================================================
// CURSOR MANAGER
// ============================================================================
const CursorManager = {
    calculatePositionFromClick(clickY, text) {
        const clickLine = Math.floor((clickY - CONFIG.PADDING) / CONFIG.LINE_HEIGHT);
        const lines = text.split('\n');
        let cursorPos = 0;

        for (let i = 0; i < Math.min(clickLine, lines.length); i++) {
            cursorPos += lines[i].length + 1;
        }

        return cursorPos;
    },

    getLineNumber(text, cursorPos) {
        return text.substring(0, cursorPos).split('\n').length;
    }
};

// ============================================================================
// EDITOR MANAGER
// ============================================================================
const EditorManager = {
    autosaveTimeout: null,

    switchToEdit(clickY) {
        DOM.preview.style.display = 'none';
        DOM.input.style.display = 'block';

        requestAnimationFrame(() => {
            DOM.input.focus();

            const cursorPos = CursorManager.calculatePositionFromClick(
                clickY,
                DOM.input.value
            );

            DOM.input.setSelectionRange(cursorPos, cursorPos);
            ScrollManager.centerPosition(clickY);
        });
    },

    switchToPreview(markdown, cursorPos) {
        const lineNumber = CursorManager.getLineNumber(DOM.input.value, cursorPos);
        const cursorY = ScrollManager.calculateCursorY(lineNumber);

        DOM.input.style.display = 'none';
        DOM.preview.innerHTML = marked.parse(markdown);
        DOM.preview.style.display = 'block';

        ScrollManager.centerPosition(cursorY);
    },

    saveContent(content) {
        Storage.save(content);
    },

    autosave(content) {
        clearTimeout(this.autosaveTimeout);
        this.autosaveTimeout = setTimeout(() => {
            this.saveContent(content);
        }, CONFIG.AUTOSAVE_DELAY);
    }
};

// ============================================================================
// EVENT HANDLERS
// ============================================================================
const EventHandlers = {
    onDoubleClick(e) {
        if (e.target === DOM.trigger) return;

        const clickY = e.clientY + window.scrollY;
        EditorManager.switchToEdit(clickY);
    },

    onBlur() {
        const markdown = DOM.input.value;
        const cursorPos = DOM.input.selectionStart;

        EditorManager.saveContent(markdown);
        EditorManager.switchToPreview(markdown, cursorPos);
    },

    onInput() {
        EditorManager.autosave(DOM.input.value);
    }
};

// ============================================================================
// APP INITIALIZATION
// ============================================================================
const App = {
    init() {
        MarkdownConfig.init();
        ThemeManager.init();
        this.loadSavedContent();
        this.attachEventListeners();
    },

    loadSavedContent() {
        const savedMarkdown = Storage.load();
        DOM.preview.innerHTML = marked.parse(savedMarkdown);
        DOM.input.value = savedMarkdown;
    },

    attachEventListeners() {
        DOM.body.addEventListener('dblclick', EventHandlers.onDoubleClick);
        DOM.input.addEventListener('blur', EventHandlers.onBlur);
        DOM.input.addEventListener('input', EventHandlers.onInput);
    }
};

// Start app
App.init();
