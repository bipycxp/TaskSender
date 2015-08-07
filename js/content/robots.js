/*global chrome, location */
/*jslint browser: true */

function getParameter(name) {
    'use strict';
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');

    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.href);

    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

chrome.runtime.sendMessage({
    robots : true,
    code   : getParameter('code'),
    state  : getParameter('state'),
    error  : getParameter('error')
});
