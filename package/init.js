chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
        id: 'Editor',
        innerBounds: {
            width: 380,
            height: 600,
            left: 100,
            top: 100,
            minWidth: 380,
            minHeight: 600
        }
    });
});