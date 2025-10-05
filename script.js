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
    input: document.querySelector('.markdown-input'),
    exportButtons: document.querySelector('.export-buttons'),
    exportBtns: document.querySelectorAll('.export-btn')
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
// EXPORT MANAGER
// ============================================================================
const ExportManager = {
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    },

    exportTXT(content) {
        this.downloadFile(content, 'file.txt', 'text/plain');
    },

    exportMD(content) {
        this.downloadFile(content, 'file.md', 'text/markdown');
    },

    exportPDF(content) {
        const html = marked.parse(content);
        const timestamp = new Date().toISOString().split('T')[0];

        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Export PDF</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 40px auto;
                        padding: 20px;
                        color: #000;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        font-weight: 600;
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                    }
                    code {
                        background-color: #f5f5f5;
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-family: 'Consolas', monospace;
                    }
                    pre {
                        background-color: #f5f5f5;
                        padding: 16px;
                        border-radius: 4px;
                        overflow-x: auto;
                    }
                    pre code {
                        background: none;
                        padding: 0;
                    }
                    blockquote {
                        border-left: 3px solid #e0e0e0;
                        padding-left: 1em;
                        color: #666;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                    }
                    th, td {
                        padding: 8px 12px;
                        text-align: left;
                    }
                    th {
                        font-weight: 600;
                        border-bottom: 1px solid #e0e0e0;
                    }
                </style>
            </head>
            <body>${html}</body>
            </html>
        `);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    },

    updateVisibility(content) {
        if (content.trim().length > 0) {
            DOM.exportButtons.classList.add('visible');
        } else {
            DOM.exportButtons.classList.remove('visible');
        }
    },

    init() {
        DOM.exportBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                const content = Storage.load();

                if (format === 'txt') {
                    this.exportTXT(content);
                } else if (format === 'md') {
                    this.exportMD(content);
                } else if (format === 'pdf') {
                    this.exportPDF(content);
                }
            });
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
        ExportManager.updateVisibility(content);
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
        ExportManager.init();
        this.loadSavedContent();
        this.attachEventListeners();
    },

    loadSavedContent() {
        const savedMarkdown = Storage.load();
        DOM.preview.innerHTML = marked.parse(savedMarkdown);
        DOM.input.value = savedMarkdown;
        ExportManager.updateVisibility(savedMarkdown);
    },

    attachEventListeners() {
        DOM.body.addEventListener('dblclick', EventHandlers.onDoubleClick);
        DOM.input.addEventListener('blur', EventHandlers.onBlur);
        DOM.input.addEventListener('input', EventHandlers.onInput);
    }
};

// Start app
App.init();
