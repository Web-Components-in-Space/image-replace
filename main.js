document.addEventListener('keydown', e => {
    if (e.key === 's' && e.ctrlKey) {
        doSwap();
    }
});

const modes = ['original', 'ai', 'text'];
let currentMode = 0;

const doSwap = () => {
    currentMode ++;
    if (currentMode > modes.length -1) {
        currentMode = 0;
    }
    const elements = document.body.querySelectorAll('img');

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const computedStyle = window.getComputedStyle(element);
        const attrs = element.attributes;
        const replacer = document.createElement('img-replace');
        replacer.setAttribute('image-mode', modes[currentMode]);
        for (let i = 0; i < attrs.length; i++) {
            replacer.setAttribute(attrs[i].name, attrs[i].value);
        }
        chrome.storage.sync.get(['serviceURL']).then(result => {
            replacer.setAttribute('image-service', result.serviceURL || 'http://localhost:5000');
        });

        replacer.style.width = computedStyle.width;
        replacer.style.height = computedStyle.height;
        element.replaceWith(replacer);
    }

    const alreadyReplaced = document.getElementsByTagName('img-replace');

    for (let i = 0; i < alreadyReplaced.length; i++) {
        alreadyReplaced[i].setAttribute('image-mode', modes[currentMode]);
    }
};