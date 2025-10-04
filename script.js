const trigger = document.querySelector('.trigger');
const body = document.body;

trigger.addEventListener('click', function() {
    body.classList.toggle('dark-mode');
});
