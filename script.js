const trigger = document.querySelector('.trigger');
const body = document.body;
const markdownPreview = document.querySelector('.markdown-preview');
const markdownInput = document.querySelector('.markdown-input');

// Configure marked
marked.use({
    breaks: true,
    gfm: true,
    renderer: {
        html(html) {
            // Escape HTML to display as text instead of rendering
            return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
    }
});

// Toggle dark mode
trigger.addEventListener('click', function() {
    body.classList.toggle('dark-mode');
});

// Load saved markdown
const savedMarkdown = localStorage.getItem('noteMarkdown') || '';
markdownPreview.innerHTML = marked.parse(savedMarkdown);
markdownInput.value = savedMarkdown;

// Double click to edit
body.addEventListener('dblclick', function(e) {
    if (e.target === trigger) return;

    // Calculate click position relative to page
    const clickY = e.clientY + window.scrollY;

    markdownPreview.style.display = 'none';
    markdownInput.style.display = 'block';

    requestAnimationFrame(() => {
        markdownInput.focus();

        // Calculate approximate cursor position in textarea
        const text = markdownInput.value;
        const lineHeight = 1.6 * 16; // line-height * font-size
        const padding = 20;
        const clickLine = Math.floor((clickY - padding) / lineHeight);

        // Set cursor position
        const lines = text.split('\n');
        let cursorPos = 0;
        for (let i = 0; i < Math.min(clickLine, lines.length); i++) {
            cursorPos += lines[i].length + 1; // +1 for \n
        }

        markdownInput.setSelectionRange(cursorPos, cursorPos);

        // Scroll to center the clicked line
        const targetScroll = clickY - (window.innerHeight / 2);
        window.scrollTo(0, Math.max(0, targetScroll));
    });
});

// Save and preview on blur
markdownInput.addEventListener('blur', function() {
    const markdown = markdownInput.value;
    localStorage.setItem('noteMarkdown', markdown);

    // Get cursor position to calculate scroll
    const cursorPos = markdownInput.selectionStart;
    const textBeforeCursor = markdownInput.value.substring(0, cursorPos);
    const lineNumber = textBeforeCursor.split('\n').length;
    const lineHeight = 1.6 * 16;
    const padding = 20;
    const cursorY = padding + (lineNumber - 1) * lineHeight;

    markdownInput.style.display = 'none';
    markdownPreview.innerHTML = marked.parse(markdown);
    markdownPreview.style.display = 'block';

    // Scroll to center the cursor position
    requestAnimationFrame(() => {
        const targetScroll = cursorY - (window.innerHeight / 2);
        window.scrollTo(0, Math.max(0, targetScroll));
    });
});

// Live preview while typing (debounced)
let previewTimeout;
markdownInput.addEventListener('input', function() {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
        const markdown = markdownInput.value;
        localStorage.setItem('noteMarkdown', markdown);
    }, 500);
});
