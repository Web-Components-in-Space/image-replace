const requestGeneration = (prompt, endpoint, opts = {}) => {
    return new Promise(resolve => {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                prompt,
                steps: opts.steps ? opts.steps : 35,
                sampler_index: opts.sampler ? opts.sampler : 'DDIM',
            })
        };
        fetch(endpoint, requestOptions)
            .then(response => response.json())
            .then(data => {
                resolve(data.images[0]);
            }).catch(err => {
                resolve(null);
        });
    });
}

class ImageReplace extends HTMLElement {
    static get observedAttributes() { return ['src', 'data-src', 'alt', 'image-mode', 'image-service']; }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                    :host {
                        display: inline-block;
                        font-family: sans-serif;
                    }
                    
                    #display {
                        position: relative;
                        overflow: hidden;
                        width: 100%;
                        height: 100%;
                        animation: none;
                    }
                    
                    :host(:hover) #controls {
                        display: flex;
                        position: relative;
                        width: 100%;
                        height: 100%;
                    }
        
                    #controls {
                        overflow: hidden;
                        width: 100%;
                        height: 100%;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        line-height: normal;
                        color: white;
                        display: none;
                    }
                    
                    #controls span {
                        background-color: rgba(0, 0, 0, .75);
                        padding: 8px;
                        text-align: center;
                    }
                    
                    #display.loaded {
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                        animation: none;
                    }
                    
                    #display.loading {
                        animation: anim 2s linear infinite;
                    }
                    
                    button {
                        border-radius: 2px;
                        background-color: black;
                        color: white;
                        cursor: pointer;
                        border-color: white;
                        border-style: solid;
                        border-width: 1px;
                        padding: 8px;
                        outline: none;
                    }
                    
                    button[disabled] {
                        display: none;
                    }
                    
                    button:hover {
                        background-color: white;
                        border-color: black;
                        color: black;
                    }
                    
                    @keyframes anim {
                        to {background-position:0 -400%}
                    }
            </style>
            <div id="display"></div>
        `;

        this.display = this.shadowRoot.querySelector('div');
        this.imageMode = this.getAttribute('image-mode');
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.generatedImage = undefined;
        this.errorNoImage = false;

        this.shadowRoot.addEventListener('click',  (event) => {
            if (event.target.id === 'generate') {
                event.target.disabled = true;
                this.loadImageReplacement('ai');
            } else if (event.target.id === 'original') {
                this.imageMode = 'original';
            }
        })
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'src':
                this.loadOriginalImage();
                break;
            case 'image-mode':
                this.imageMode = newValue;
                break;
        }
    }

    set imageMode(val) {
        if (!this.display) {
            return;
        }

        switch (val) {
            case 'ai':
                let content = ''
                if (this.generatedImage) {
                    this.display.style.backgroundImage = `url("${this.generatedImage}")`;
                    content = `<div id="controls"><button id="original">Show Original</button><br /><span>${this.getAttribute('alt')}</span></div>`;
                } else if (this.errorNoImage) {
                    this.display.style.backgroundImage = "radial-gradient(circle, rgba(238,174,202,1) 0%, rgba(158,0,0,1) 100%)";
                } else if (!this.isLoaded) {
                    content = `<div id="controls"><button>Show Original</button><br /><span>${this.getAttribute('alt')}</span></div>`;
                }
                this.display.innerHTML = content;
                if (this.errorNoImage) {
                    this.display.innerHTML = '<div id="controls"><span>No alt text provided</span></div>';
                }
                break;

            case 'original':
            default:
                const og = this.getAttribute('src') || this.getAttribute('data-src');
                this.display.style.backgroundImage = `url("${og}")`;
                if (this.getAttribute('alt')) {
                    this.display.innerHTML = `<div id="controls"><button id="generate">${this.generatedImage ? 'Show Generated' : 'Generate'}</button><br /><span>${this.getAttribute('alt')}</span></div>`;
                } else {
                    this.display.innerHTML = `<div id="controls"><br /><span>Oops! This image doesn't have any accessible text to generate an image from</span></div>`;
                }
                break;
        }
    }

    loadOriginalImage() {
        const image = new Image();
        image.src = this.getAttribute('src');
    }

    loadImageReplacement(forceMode) {
        // if we're already generated, we've cached it
        if (this.generatedImage) {
            this.imageMode = forceMode || this.getAttribute('image-mode');
            return;
        }

        if (!this.getAttribute('alt')) {
            this.generatedImage = '';
            this.display.classList.add('loaded');
            this.isLoaded = true;
            this.errorNoImage = true;
            this.imageMode = this.getAttribute('image-mode');
        } else if (this.hasAttribute('image-service')) {
            this.display.classList.add('loading');
            requestGeneration(this.getAttribute('alt'), this.getAttribute('image-service')).then(img => {
                if (!img) {
                    this.display.innerHTML = `<div id="controls"><button id="generate">Try again?</button><br /><span>Oops, that didn't work...</span></div>`
                    this.display.classList.add('loaded');
                    this.display.classList.remove('loading');
                    this.isLoaded = true;
                } else {
                    this.generatedImage = 'data:image/png;base64,' + img;
                    this.display.classList.add('loaded');
                    this.display.classList.remove('loading');
                    this.isLoaded = true;
                    this.imageMode = forceMode || this.getAttribute('image-mode');
                }
            });
        }
    }
}

if (!customElements.get('img-replace')) {
    customElements.define('img-replace', ImageReplace);
}