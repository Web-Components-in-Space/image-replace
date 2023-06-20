// Saves options to chrome.storage
function save() {
    const url = document.getElementById('service-url').value;
    const sampler = document.getElementById('sampler').value;
    const steps = document.getElementById('steps').value;
    chrome.storage.sync.set({
        serviceURL: url,
        sampler,
        steps
    }, function() {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}
chrome.storage.sync.get(['serviceURL']).then( result => {
    document.getElementById('service-url').value = result.serviceURL;
});

chrome.storage.sync.get(['sampler']).then( result => {
    document.getElementById('sampler').value = result.sampler;
});

chrome.storage.sync.get(['steps']).then( result => {
    document.getElementById('steps').value = result.steps;
});



document.getElementById('save').addEventListener('click', save);