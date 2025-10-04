const trigger = document.querySelector('.trigger');
const body = document.body;
const markdownPreview = document.querySelector('.markdown-preview');
const markdownInput = document.querySelector('.markdown-input');

// Configure marked
marked.setOptions({
    breaks: true,
    gfm: true
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
    markdownPreview.style.display = 'none';
    markdownInput.style.display = 'block';
    markdownInput.focus();
});

// Save and preview on blur
markdownInput.addEventListener('blur', function() {
    const markdown = markdownInput.value;
    localStorage.setItem('noteMarkdown', markdown);
    markdownPreview.innerHTML = marked.parse(markdown);
    markdownInput.style.display = 'none';
    markdownPreview.style.display = 'block';
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
