let swapped = false;
document.addEventListener('keydown', e => {
    if (e.key === 's' && e.ctrlKey) {
        if (!swapped) {
            doSwap();
            swapped = true;
        } else {
            alert('This page is already in generation mode. Hover over an image on the page to generate an image from the alt text');
        }
    }
});

const doSwap = () => {
    const elements = document.body.querySelectorAll('img');

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const computedStyle = window.getComputedStyle(element);
        const attrs = element.attributes;
        const replacer = document.createElement('img-replace');
        for (let i = 0; i < attrs.length; i++) {
            replacer.setAttribute(attrs[i].name, attrs[i].value);
        }
        chrome.storage.sync.get(['serviceURL', 'sampler', 'steps']).then(result => {
            replacer.setAttribute('image-service', result.serviceURL || 'http://localhost:5000');
            replacer.setAttribute('sampler', result.sampler || 'DDIM');
            replacer.setAttribute('steps', result.sampler || '35');
        });

        replacer.style.width = computedStyle.width;
        replacer.style.height = computedStyle.height;
        element.replaceWith(replacer);
    }
    alert('Generative mode activated! Hover over an image on the page to generate an image from the alt text')
};