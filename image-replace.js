class ImageReplace extends HTMLElement {
    static get observedAttributes() { return ['src', 'data-src', 'alt', 'image-service', 'image-mode']; }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                    :host {
                        display: inline-block;
                        font-family: sans-serif;
                    }
                    div {
                        display: block;
                        position: relative;
                        width: 100%;
                        height: 100%;
                        color: white;
                        background: 
                           linear-gradient(rgba(255,0,0,1) 0%, rgba(255,154,0,1) 10%, rgba(208,222,33,1) 20%, rgba(79,220,74,1) 30%, rgba(63,218,216,1) 40%, rgba(47,201,226,1) 50%, rgba(28,127,238,1) 60%, rgba(95,21,242,1) 70%, rgba(186,12,248,1) 80%, rgba(251,7,217,1) 90%, rgba(255,0,0,1) 100%) 
                           0 0/100% 200%;
                           animation: anim 2s linear infinite;
                    }
                    
                    div span {
                        position: absolute;
                        overflow: hidden;
                        width: calc(100% - 10px);
                        height: calc(100% - 10px);
                        left: 5px;
                        top: 5px;
                        line-height: normal;
                        color: hotpink;
                    }
                    
                    div.loaded {
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                        animation: none;
                    }
                    
                    :host([image-mode="text"]) div.loaded {
                        background-image: none !important;
                        background-color: black;
                    }
                    
                    :host([image-mode="text"]) div.loaded p {
                        display: inline-block;
                    }
                    
                    @keyframes anim {
                        to {background-position:0 -200%}
                    }
            </style>
            <div style="position: relative"></div>
        `;

        this.display = this.shadowRoot.querySelector('div');
        this.loadImageReplacement(this.imageURL);
        this.imageMode = this.getAttribute('image-mode');
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.generatedImage = undefined;
    }

    get imageURL() {
        if (!this.hasAttribute('image-service') ) {
            return undefined;
        }
        const prompt = this.hasAttribute('alt') ? this.getAttribute('alt') : '';
        return `${this.getAttribute('image-service')}/?prompt=${encodeURIComponent(prompt)}`;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'src':
                this.loadOriginalImage();
                break;
            case 'image-mode':
                this.imageMode = newValue;
                break;
            case 'image-service':
                this.loadImageReplacement(this.imageURL);
        }
    }

    set imageMode(val) {
        if (!this.display) {
            return;
        }

        switch (val) {
            case 'ai':
                if (this.generatedImage) {
                    this.display.style.backgroundImage = `url("${this.generatedImage}")`;
                }
                this.display.innerHTML = '';
                break;

            case 'text':
                this.display.innerHTML = `<span>${this.getAttribute('alt')}</span>`;
                break;

            case 'original':
            default:
                const og =this.getAttribute('src') || this.getAttribute('data-src'); // encodeURI('https://www.simplyrecipes.com/thmb/p4d7nLErKZ9IMo9eOumQiEQ8PL8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Simply-Recipes-Orange-Breakfast-Rolls-LEAD-3-791478047c984d479a5f3321694f8bed.jpg');//this.getAttribute('src') ? this.getAttribute('src') : 'https://www.whitehouse.gov/wp-content/uploads/2021/01/P20221128AS-0319.jpg'
                this.display.style.backgroundImage = `url("${og}")`;
                this.display.innerHTML = '';
                break;

        }
    }

    loadOriginalImage() {
        const image = new Image();
        image.src = this.getAttribute('src');
    }

    loadImageReplacement(uri) {
        if (!uri) {
            return;
        }
        fetch(uri).then(response => {
                if (response.status === 204) {
                    return undefined;
                } else {
                    return response.blob();
                }
            }).then(imageBlob => {
                if (!imageBlob) {
                    // try again (and again, and again) but wait 1 second
                    setTimeout( () => {
                        this.loadImageReplacement(uri);
                    }, 3000);
                    return;
                }
                // Then create a local URL for that image and print it
                 this.generatedImage = URL.createObjectURL(imageBlob);
                 this.imageMode = this.getAttribute('image-mode');
                 this.display.classList.add('loaded');
            }).catch(err => {
                console.log('error', err)
            });
    }
}

if (!customElements.get('img-replace')) {
    customElements.define('img-replace', ImageReplace);
}