// Saves options to chrome.storage
function save() {
    const url = document.getElementById('service-url').value;
    chrome.storage.sync.set({
        serviceURL: url
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



document.getElementById('save').addEventListener('click', save);