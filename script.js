// ============================================================================
// CONFIG
// ============================================================================
const CONFIG = {
    STORAGE_KEY: 'noteMarkdown',
    PERSIST_MODE_KEY: 'persistMode',
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
    exportBtns: document.querySelectorAll('.export-btn'),
    persistToggle: document.querySelector('.persist-toggle'),
    persistIcon: document.querySelector('.persist-icon')
};

// ============================================================================
// MARKDOWN CONFIG
// ============================================================================
const MarkdownConfig = {
    init() {
        marked.use({
            breaks: true,
            gfm: true,
            mangle: false,
            headerIds: false,
            pedantic: false,
            renderer: {
                html(html) {
                    // Escape HTML to prevent rendering
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
    isPersistMode() {
        return localStorage.getItem(CONFIG.PERSIST_MODE_KEY) === 'true';
    },

    save(content) {
        if (this.isPersistMode()) {
            localStorage.setItem(CONFIG.STORAGE_KEY, content);
        } else {
            sessionStorage.setItem(CONFIG.STORAGE_KEY, content);
        }
    },

    load() {
        if (this.isPersistMode()) {
            return localStorage.getItem(CONFIG.STORAGE_KEY) || '';
        } else {
            return sessionStorage.getItem(CONFIG.STORAGE_KEY) || '';
        }
    },

    togglePersistMode() {
        const currentMode = this.isPersistMode();
        const newMode = !currentMode;

        localStorage.setItem(CONFIG.PERSIST_MODE_KEY, String(newMode));

        // Transfer content between storage types
        const content = currentMode
            ? localStorage.getItem(CONFIG.STORAGE_KEY) || ''
            : sessionStorage.getItem(CONFIG.STORAGE_KEY) || '';

        if (newMode) {
            // Switch to persistent
            localStorage.setItem(CONFIG.STORAGE_KEY, content);
            sessionStorage.removeItem(CONFIG.STORAGE_KEY);
        } else {
            // Switch to session
            sessionStorage.setItem(CONFIG.STORAGE_KEY, content);
            localStorage.removeItem(CONFIG.STORAGE_KEY);
        }

        return newMode;
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
// PERSIST MANAGER
// ============================================================================
const PersistManager = {
    updateIcon() {
        const isPersist = Storage.isPersistMode();
        DOM.persistIcon.src = isPersist ? 'icon/copy done.png' : 'icon/close.png';
    },

    toggle() {
        const newMode = Storage.togglePersistMode();
        this.updateIcon();

        // Visual feedback
        DOM.persistIcon.style.opacity = '1';
        setTimeout(() => {
            DOM.persistIcon.style.opacity = '';
        }, 300);
    },

    init() {
        this.updateIcon();
        DOM.persistToggle.addEventListener('click', () => {
            this.toggle();
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
        // Detect if content is plain text/HTML code or markdown
        const isPlainText = this.isPlainTextContent(content);

        let bodyContent;
        if (isPlainText) {
            // Export as plain text with preserved formatting
            bodyContent = `<pre style="white-space: pre-wrap; font-family: 'IBM Plex Mono', 'Menlo', 'Consolas', monospace;">${this.escapeHtml(content)}</pre>`;
        } else {
            // Export as rendered markdown
            bodyContent = marked.parse(content);
        }

        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Export PDF</title>
                <style>
                    body {
                        font-family: 'IBM Plex Mono', 'Menlo', 'Consolas', monospace;
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 40px auto;
                        padding: 20px;
                        color: #000;
                        font-size: 16px;
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
                        font-family: 'IBM Plex Mono', 'Menlo', 'Consolas', monospace;
                    }
                    pre {
                        background-color: #f5f5f5;
                        padding: 16px;
                        border-radius: 4px;
                        overflow-x: auto;
                        white-space: pre-wrap;
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
            <body>${bodyContent}</body>
            </html>
        `);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    },

    exportHTML(content) {
        // Check if content is a complete HTML document
        const isCompleteHTML = /^\s*<!DOCTYPE\s+html/i.test(content.trim());

        if (isCompleteHTML) {
            // Export as-is (raw HTML file)
            this.downloadFile(content, 'file.html', 'text/html');
        } else {
            // Detect if content is plain text/code or markdown
            const isPlainText = this.isPlainTextContent(content);

            let bodyContent;
            if (isPlainText) {
                // Export as plain text with preserved formatting
                bodyContent = `<pre style="white-space: pre-wrap; font-family: 'IBM Plex Mono', 'Menlo', 'Consolas', monospace;">${this.escapeHtml(content)}</pre>`;
            } else {
                // Export as rendered markdown
                bodyContent = marked.parse(content);
            }

            const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Note</title>
    <style>
        body {
            font-family: 'IBM Plex Mono', 'Menlo', 'Consolas', monospace;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #000;
            font-size: 16px;
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
            font-family: 'IBM Plex Mono', 'Menlo', 'Consolas', monospace;
        }
        pre {
            background-color: #f5f5f5;
            padding: 16px;
            border-radius: 4px;
            overflow-x: auto;
            white-space: pre-wrap;
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
<body>
${bodyContent}
</body>
</html>`;
            this.downloadFile(fullHTML, 'file.html', 'text/html');
        }
    },

    isPlainTextContent(text) {
        // Count HTML-like tags
        const htmlTagCount = (text.match(/<[^>]+>/g) || []).length;
        const lines = text.split('\n').length;

        // If more than 30% of lines have HTML tags, treat as plain text
        return htmlTagCount > lines * 0.3;
    },

    escapeHtml(text) {
        return text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#39;');
    },

    updateVisibility(content) {
        if (content.trim().length > 0) {
            DOM.exportButtons.classList.add('visible');
        } else {
            DOM.exportButtons.classList.remove('visible');
        }
    },

    copyToClipboard(content) {
        const copyIcon = document.querySelector('.copy-icon');

        navigator.clipboard.writeText(content).then(() => {
            this.showCopySuccess(copyIcon);
        }).catch(err => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = content;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showCopySuccess(copyIcon);
        });
    },

    showCopySuccess(iconElement) {
        const originalSrc = iconElement.src;
        iconElement.src = 'icon/copy done.png';

        setTimeout(() => {
            iconElement.src = originalSrc;
        }, 600);
    },

    init() {
        DOM.exportBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const format = btn.dataset.format;
                const content = Storage.load();

                if (action === 'copy') {
                    this.copyToClipboard(content);
                } else if (format === 'txt') {
                    this.exportTXT(content);
                } else if (format === 'md') {
                    this.exportMD(content);
                } else if (format === 'pdf') {
                    this.exportPDF(content);
                } else if (format === 'html') {
                    this.exportHTML(content);
                }
            });
        });
    }
};

// ============================================================================
// SCROLL MANAGER
// ============================================================================
const ScrollManager = {
    calculateCursorY(lineNumber) {
        return CONFIG.PADDING + (lineNumber - 1) * CONFIG.LINE_HEIGHT;
    },

    handleScroll() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        if (scrollTop > 100) {
            // Scrolled down - hide buttons
            DOM.trigger.classList.add('hidden');
            DOM.exportButtons.classList.add('hidden');
        } else {
            // At top - show buttons
            DOM.trigger.classList.remove('hidden');
            DOM.exportButtons.classList.remove('hidden');
        }
    },

    init() {
        window.addEventListener('scroll', () => this.handleScroll());
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

            const absoluteClickY = clickY + window.scrollY;
            const cursorPos = CursorManager.calculatePositionFromClick(
                absoluteClickY,
                DOM.input.value
            );

            DOM.input.setSelectionRange(cursorPos, cursorPos);
        });
    },

    switchToPreview(markdown, cursorPos) {
        DOM.input.style.display = 'none';

        // Detect if content is mostly HTML/code (not markdown)
        const isPlainText = this.isPlainTextContent(markdown);

        if (isPlainText) {
            // Render as plain text with preserved formatting
            DOM.preview.innerHTML = `<pre style="white-space: pre-wrap; font-family: 'IBM Plex Mono', 'Menlo', 'Consolas', monospace;">${this.escapeHtml(markdown)}</pre>`;
        } else {
            // Render as markdown
            DOM.preview.innerHTML = marked.parse(markdown);
        }

        DOM.preview.style.display = 'block';
    },

    isPlainTextContent(text) {
        // Count HTML-like tags
        const htmlTagCount = (text.match(/<[^>]+>/g) || []).length;
        const lines = text.split('\n').length;

        // If more than 30% of lines have HTML tags, treat as plain text
        return htmlTagCount > lines * 0.3;
    },

    escapeHtml(text) {
        return text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#39;');
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
    isEditMode: false,

    onDoubleClick(e) {
        if (e.target === DOM.trigger) return;

        const clickY = e.clientY;
        this.isEditMode = true;
        EditorManager.switchToEdit(clickY);
    },

    onMouseDown(e) {
        // Only handle clicks outside textarea when in edit mode
        if (!this.isEditMode) return;

        // Check if click is outside textarea and export buttons
        if (e.target !== DOM.input &&
            !DOM.exportButtons.contains(e.target) &&
            e.target !== DOM.trigger &&
            e.target !== DOM.persistToggle &&
            !DOM.persistToggle.contains(e.target)) {

            this.isEditMode = false;

            const markdown = DOM.input.value;
            const cursorPos = DOM.input.selectionStart;

            EditorManager.saveContent(markdown);
            EditorManager.switchToPreview(markdown, cursorPos);
        }
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
        PersistManager.init();
        ExportManager.init();
        ScrollManager.init();
        this.loadSavedContent();
        this.attachEventListeners();
    },

    loadSavedContent() {
        const savedMarkdown = Storage.load();

        // Auto-detect plain text vs markdown
        const isPlainText = EditorManager.isPlainTextContent(savedMarkdown);

        if (isPlainText) {
            DOM.preview.innerHTML = `<pre style="white-space: pre-wrap; font-family: 'IBM Plex Mono', 'Menlo', 'Consolas', monospace;">${EditorManager.escapeHtml(savedMarkdown)}</pre>`;
        } else {
            DOM.preview.innerHTML = marked.parse(savedMarkdown);
        }

        DOM.input.value = savedMarkdown;
        ExportManager.updateVisibility(savedMarkdown);
    },

    attachEventListeners() {
        DOM.body.addEventListener('dblclick', EventHandlers.onDoubleClick.bind(EventHandlers));
        DOM.body.addEventListener('mousedown', EventHandlers.onMouseDown.bind(EventHandlers));
        DOM.input.addEventListener('input', EventHandlers.onInput);
    }
};

// Start app
App.init();
