// Initialize the app
//var logger = (forge && forge.logging) ? forge.logging : { info: console.log, error: console.log };
var logger = { info: console.log, error: function(text) { console.log('ERROR: ' + text) } };
function log(message) {
    console.log(message);
}

function log_error(message) {
    console.log('ERROR: ' + message);
}

function success() { log('Success!'); }
function error(content) { log_error(content); }

// Initialize Parse
Parse.initialize("ChlGfJAgxi3j31gH1RbdYCNUDqLU8Xjg2c5yZ0eJ", "rCLLSMnJySeTFohQoZsTk7rY2hpaH1NlwdpjoPp3");
