const trigger = document.querySelector('.trigger');
const body = document.body;
const textDisplay = document.querySelector('.text-display');
const textInput = document.querySelector('.text-input');

// Toggle dark mode
trigger.addEventListener('click', function() {
    body.classList.toggle('dark-mode');
});

// Load saved text
const savedText = localStorage.getItem('noteText') || '';
textDisplay.textContent = savedText;
textInput.value = savedText;

// Double click to edit
body.addEventListener('dblclick', function(e) {
    if (e.target === trigger) return;
    textDisplay.style.display = 'none';
    textInput.style.display = 'block';
    textInput.focus();
});

// Save and exit on blur
textInput.addEventListener('blur', function() {
    const text = textInput.value;
    localStorage.setItem('noteText', text);
    textDisplay.textContent = text;
    textInput.style.display = 'none';
    textDisplay.style.display = 'block';
});

// Auto-resize textarea
textInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.max(100, this.scrollHeight) + 'px';
});
