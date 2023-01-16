const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
spawn = require('child_process').spawn;

const mime = {
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
};

const stableDiffusionDirectory = '/Users/farrell/Documents/projects/stable-diffusion';
const stableDiffusionOutputDirectory = `${stableDiffusionDirectory}/outputs/txt2img-samples`;
const imageOutputDir = path.join(__dirname, 'output');
const imageMapFile = `${imageOutputDir}/imagemap.json`;

let stableDiffusionTask;
let currentPrompt;

const requestsMade = fs.existsSync(imageMapFile) === true ? JSON.parse(fs.readFileSync(imageMapFile)) : {};
const requestQueue = [];

const server = http.createServer(function (req, res) {
    const params = url.parse(req.url,true).query;

    if (params.prompt === '') {
        const stream = fs.createReadStream('sample-image.jpg');
        stream.on('open', function () {
            res.setHeader('Content-Type', mime.jpg);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Request-Method', '*');
            res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
            res.setHeader('Access-Control-Allow-Headers', '*');
            stream.pipe(res);
        });
        return;
    }

    const generatedPromptFile = requestsMade[params.prompt];
    const image = generatedPromptFile;
    const exists = generatedPromptFile && fs.existsSync(image);

    if (!exists && !requestsMade[params.prompt]) {
        generateImage(params.prompt);
        requestsMade[params.prompt] = undefined;
    }

    if (!exists) {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Request-Method', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.statusCode = 204;
        res.end('Not found');
    } else {
        var s = fs.createReadStream(image);
        s.on('open', function () {
            res.setHeader('Content-Type', mime.jpg);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Request-Method', '*');
            res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
            res.setHeader('Access-Control-Allow-Headers', '*');
            s.pipe(res);
        });
    }
});

const generateImage = (prompt) => {
    if (prompt === currentPrompt) {
        return;
    }
    if (stableDiffusionTask) {
        if (requestQueue.indexOf(prompt) === -1) {
            console.info(`Queue Prompt: ${prompt} with ${requestQueue.length} waiting`);
            requestQueue.push(prompt);
        }
        return;
    }

    console.info('Generate Image', prompt);
    currentPrompt = prompt;
    stableDiffusionTask = spawn('source venv/bin/activate && python',
        ['scripts/txt2img.py', `--prompt "${prompt}"`, '--n_samples 1', '--n_iter 1', '--plms'],
        {cwd: stableDiffusionDirectory, shell: true });
    stableDiffusionTask.stderr.on('data', function (data) {
       // console.error("STDERR:", data.toString());
    });
    stableDiffusionTask.stdout.on('data', function (data) {
        // console.log("STDOUT:", data.toString());
    });
    stableDiffusionTask.on('exit', function (exitCode) {
        const filename = crypto.randomUUID();
        const newfile = getNewestFile(stableDiffusionOutputDirectory);
        const inStr = fs.createReadStream(newfile);
        const outStr = fs.createWriteStream(`${imageOutputDir}/${filename}.jpg`);
        inStr.pipe(outStr);
        requestsMade[prompt] = `${imageOutputDir}/${filename}.jpg`;
        const data = JSON.stringify(requestsMade, undefined, 2);
        fs.writeFileSync(imageMapFile, data);
        stableDiffusionTask = undefined;

        if (requestQueue.length > 0) {
            const next = requestQueue.pop();
            console.info(`Generate queued image ${next} with ${requestQueue.length} images still waiting`);
            generateImage(next);
        } else {
            console.info('Finished rendering images');
            currentPrompt = undefined;
        }
    });
    stableDiffusionTask.on('error', function (err) {
        // console.log("Child exited with error" + err);
    });
}

const getNewestFile = (dir) => {
    let highestDatestamp = 0;
    let newest;
    const files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const time = fs.statSync(path.join(dir, files[i])).mtime.getTime()
        if (time > highestDatestamp) {
            highestDatestamp = time;
            newest = file;
        }
    }
    return (path.join(dir, newest));
}

server.listen(5000);