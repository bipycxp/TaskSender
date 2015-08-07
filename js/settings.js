/*global $, chrome, define */
/*jslint browser: true */

define(['jquery', 'Settings'], function ($, Settings) {
    'use strict';

    var settings = new Settings();

    chrome.runtime.onMessage.addListener(
        function (request, sender) {
            if (request.robots) {
                var service = sender.url.match(
                    new RegExp(Object.keys(settings.services).join('|'))
                );

                if (request.code && request.state) {

                    settings.services[service].getToken({
                        code : request.code
                    });

                } else if (request.error) {

                    $(document)
                        .trigger({
                            type : 'errorAuth',
                            service : service
                        });

                }

                chrome.tabs.remove(sender.tab.id);
            }
        }
    );
});
