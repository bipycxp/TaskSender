/*global $, chrome, define */
/*jslint browser: true */

define(['jquery', 'allServices'], function ($, allServices) {
    'use strict';

    var Background = function () {
        this.services = allServices;

        this.settings = JSON.parse(localStorage.getItem('settings')) || { messages : {} };

        this.extension = chrome.app.getDetails();

        this.contextId = '';

        this.lastShortcutService = '';

        this.contextMenu();

        var self = this;

        $(document)
            .on('startSendTask successSendTask errorSendTask', function (event) {
                if (self.settings.messages[event.type]) {
                    var types = {
                        startSendTask : {
                            title : 'Sending',
                            color : 'teal',
                            update : false
                        },
                        successSendTask : {
                            title : 'Sent',
                            color : 'green',
                            update : event.update && true
                        },
                        errorSendTask : {
                            title : 'Error. Try again later',
                            color : 'red',
                            update : event.update && true
                        }
                    };

                    self.message({
                        taskId : event.taskId,
                        update : types[event.type].update,
                        title : types[event.type].title,
                        text : event.text,
                        color : types[event.type].color
                    });
                }
            })
            .on('sendTask', function (event) {
                var text = event.text;

                text = text.charAt(0).toUpperCase() + text.slice(1);

                chrome.runtime.sendMessage({
                    analytics : true,
                    value : event.service,
                    type : 'Service'
                });

                self.services[event.service].sendTask(text);
            });

        chrome.notifications.onClicked.addListener(function (id) {
            chrome.notifications.clear(id);
        });
    };

    Background.prototype = {

        contextMenu : function () {
            var self = this,
                service,
                subMenu = false;

            if (this.contextId) {
                chrome.contextMenus.remove(this.contextId);
            } else {
                chrome.contextMenus.onClicked.addListener(function (info) {
                    if (self.services[info.menuItemId]) {

                        $(document)
                            .trigger({
                                type : 'sendTask',
                                service : info.menuItemId,
                                text : info.selectionText
                            });

                    }
                });
            }

            this.contextId = this.extension.id;

            chrome.contextMenus.create({
                id : this.extension.id,
                title : this.extension.name,
                contexts : [
                    'selection'
                ]
            });

            for (service in this.services) {
                if (this.services.hasOwnProperty(service) && this.services[service].enableContext) {
                    chrome.contextMenus.create({
                        id : service,
                        parentId : this.extension.id,
                        title :  service.charAt(0).toUpperCase() + service.slice(1) + ' - Send task',
                        contexts : [
                            'selection'
                        ]
                    });

                    subMenu = true;
                }
            }

            if (!subMenu) {
                chrome.contextMenus.remove(this.contextId);
            }
        },

        message : function (message) {
            var text;

            if (message.update) {
                chrome.notifications.clear(message.taskId);
            } else {
                text = message.text.length > 50 ? message.text.substr(0, 50) + '…' : message.text;

                chrome.notifications.create(
                    message.taskId,
                    {
                        type    : 'basic',
                        title   : message.title,
                        message : '"' + text + '"',
                        //iconUrl : '/img/icons/' + message.color + 'Message.png',
                        iconUrl : '/img/icons/128.png'
                    }
                );
            }
        },

        shortcuts : function (command) {
            this.lastShortcutService = command.replace('Task', '');

            chrome.tabs.query(
                {
                    currentWindow : true,
                    active : true
                },
                function (tabs) {
                    if (tabs && tabs[0]) {
                        chrome.tabs.executeScript(
                            tabs[0].id,
                            {
                                file : 'js/content/selected.js'
                            }
                        );
                    }
                }
            );
        },

        openSettings : function () {
            chrome.tabs.create({
                url: chrome.extension.getURL('html/settings.html')
            });
        }

    };

    return Background;
});
