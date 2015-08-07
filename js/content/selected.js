/*global chrome */
/*jslint browser: true */

var selected = window.getSelection().toString();

if (selected) {
    chrome.runtime.sendMessage({
        selected : true,
        text : selected
    });
}
