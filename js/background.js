/*global $, chrome, define */
/*jslint browser: true */

define(['jquery', 'Background', 'analytics'], function ($, Background) {
    'use strict';

    var background = new Background(),
        currVersion = background.extension.version,
        prevVersion = localStorage.getItem('version');

    chrome.runtime.onMessage.addListener(
        function (request) {
            if (request.updateService) {

                background.services[request.service].update();

                background.contextMenu();

            } else if (request.updateSettings) {

                background.settings = JSON.parse(localStorage.getItem('settings')) || { messages : {} };

            } else if (request.testMessage) {

                $(document)
                    .trigger({
                        type : request.type,
                        taskId : Math.random().toString(),
                        update : false,
                        text : 'Example task'
                    });

            } else if (request.selected) {

                $(document)
                    .trigger({
                        type : 'sendTask',
                        service : background.lastShortcutService,
                        text : request.text
                    });

            }
        }
    );

    chrome.commands.onCommand.addListener(function (command) {
        background.shortcuts(command);
    });

    if (currVersion !== prevVersion) {
        if (!prevVersion) {
            background.openSettings();
        } else {
            if (currVersion.replace(/\.\d+$/, '') > prevVersion.replace(/\.\d+$/, '')) {
                background.openSettings();
            }
        }

        localStorage.setItem('version', currVersion);
    }

});
