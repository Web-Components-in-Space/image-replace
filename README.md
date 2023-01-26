# image-replace
This project includes 3 things:
- A Web Component that acts like an image tag meant to serve as a swap in replacement for normal image tags
- A Node.js server to interact with Stable Diffusion locally through Python, and cache finished images such that subsequent calls don't need to generate the same image
- A Chrome extension to swap <img> tags with the <img-replace> web component

To get Stable Diffusion running on my M1 Mac, I used these instructions:
https://replicate.com/blog/run-stable-diffusion-on-m1-mac
