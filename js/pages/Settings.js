/*global $, chrome, define */
/*jslint browser: true */

define(['jquery', 'allServices', 'semantic', 'socialShare'], function ($, allServices) {
    'use strict';

    var Settings = function () {
        this.items = JSON.parse(localStorage.getItem('settings')) || {};

        this.services = allServices;

        this.extension = chrome.app.getDetails();

        this.messages = {
            startSendTask : {
                title : 'Start sending',
                enable : true
            },
            successSendTask : {
                title : 'Success sent',
                enable : true
            },
            errorSendTask : {
                title : 'Error sent',
                enable : true
            }
        };

        var actions = {
                shortcuts : $('[data-action=shortcuts]')
            },
            message;

        if (this.items.hasOwnProperty('messages')) {
            for (message in this.items.messages) {
                if (this.items.messages.hasOwnProperty(message)) {
                    this.messages[message].enable = this.items.messages[message];
                }
            }
        }

        this.save();

        actions.shortcuts
            .click(function () {
                chrome.tabs.create({
                    url: 'chrome://extensions/configureCommands'
                });
            });

        this.show();
    };

    Settings.prototype = {

        getTemplate: function (name) {
            return $('[data-template="' + name + '"]')[0].innerHTML;
        },

        show : function () {
            var self = this,
                elements = {
                    services : $('.services'),
                    messages : $('.messages'),
                    share : $('.share')
                },
                service,
                message,
                htmlServices = [],
                htmlMessages = [],
                lastTimeoutId;

            for (service in this.services) {
                if (this.services.hasOwnProperty(service)) {
                    htmlServices.push(
                        this.trService(service)
                    );
                }
            }

            for (message in this.messages) {
                if (this.messages.hasOwnProperty(message)) {
                    htmlMessages.push(
                        this.trMessage(message)
                    );
                }
            }

            elements.services
                .append(htmlServices);

            elements.messages
                .append(htmlMessages);

            elements.share.ShareLink({
                title: this.extension.name,
                text: this.extension.description,
                url: 'https://chrome.google.com/webstore/detail/' + this.extension.id,
                width: 640,
                height: 480
            });

            $(document)
                .on('closeAuth', function (event) {
                    var user = !$.isEmptyObject(self.services[event.service].user),
                        token = self.services[event.service].tokens.access;

                    if (!token || (token && user)) {
                        $('.service[data-service=' + event.service + ']').find('[data-action=connect]')
                            .removeClass('loading');
                    }
                })
                .on('successGetUser', function (event) {
                    $('.service[data-service=' + event.service + ']')
                        .replaceWith(self.trService(event.service));
                })
                .on('errorGetToken errorGetUser', function (event) {
                    $('.service[data-service=' + event.service + ']').find('.error.header')
                        .fadeIn(300, function () {
                            var error = $(this);

                            clearTimeout(lastTimeoutId);

                            lastTimeoutId = setTimeout(function () {
                                error.fadeOut(300);
                            }, 1000);
                        });
                });
        },

        trService : function (serviceName) {
            var service = this.services[serviceName],
                template = this.getTemplate(service.tokens.access ? 'connectedService' : 'disconnectedService'),
                self = this,
                tr = template
                    .replace(/\{service\}/g, serviceName)
                    .replace('{sendTo}', service.sendTo)
                    .replace('{user_name}', service.user.name)
                    .replace('{user_avatar}', service.user.avatar);

            tr = $(tr);

            tr.find('[data-action=disconnect]')
                .click(function () {
                    service.disconnect();
                    tr.replaceWith(self.trService(serviceName));
                });

            tr.find('[data-action=connect]')
                .click(function (e) {
                    $(e.currentTarget)
                        .addClass('loading');

                    service.auth();
                });

            tr.find('.ui.toggle')
                .checkbox(service.enableContext ? 'check' : 'uncheck')
                .checkbox({
                    onChange : function () {
                        service.enableContext = $(this).is(':checked');
                        service.save();
                    }
                });

            tr.find('.ui.dropdown')
                .dropdown();

            return tr;
        },

        trMessage : function (messageName) {
            var message = this.messages[messageName],
                template = this.getTemplate('message'),
                self = this,
                tr = template
                    .replace('{message}', messageName)
                    .replace('{title}', message.title);

            tr = $(tr);

            tr.find('[data-action=testMessage]')
                .click(function (e) {
                    chrome.runtime.sendMessage({
                        testMessage : true,
                        type : $(e.currentTarget).parents('tr').data('message')
                    });
                });

            tr.find('.ui.toggle')
                .checkbox(message.enable ? 'check' : 'uncheck')
                .checkbox({
                    onChange : function () {
                        message.enable = $(this).is(':checked');
                        self.save();
                    }
                });

            return tr;
        },

        save : function () {
            var messages = {},
                message;

            for (message in this.messages) {
                if (this.messages.hasOwnProperty(message)) {
                    messages[message] = this.messages[message].enable;
                }
            }

            localStorage.setItem('settings', JSON.stringify({
                messages : messages
            }));

            chrome.runtime.sendMessage({
                updateSettings : true
            });
        }

    };

    return Settings;
});

