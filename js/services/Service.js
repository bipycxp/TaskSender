/*global $, chrome, define */
/*jslint browser: true */

define(['jquery'], function ($) {
    'use strict';

    var Service = function () {

        this.client_id = this.client_id || '';
        this.client_secret = this.client_secret || '';

        this.name = this.name || '';
        this.sendTo = this.sendTo || '';
        this.tokens = {};
        this.user = {};
        this.enableContext = true;

        this.defaultAvatar = '/img/avatar.png';

        this.update();

        var self = this;

        if ($.isEmptyObject(this.user) && this.tokens.access) {
            this.getUser();
        }

        $(document)
            .on('successGetToken', function (event) {
                if (event.service === self.name) {
                    self.getUser();
                }
            });
    };

    Service.prototype = {

        randomString : function () {
            var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                result = '',
                i;

            for (i = 0; i < 20; i += 1) {
                result += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            return result;
        },

        openSettings : function () {
            chrome.tabs.create({
                url: chrome.extension.getURL('html/settings.html')
            });
        },

        openWindow : function (url) {
            var popup_width = screen.width - (screen.width * 0.5),
                popup_height = screen.height - (screen.height * 0.2),

                left = (screen.width / 2) - (popup_width / 2),
                top = (screen.height / 2) - (popup_height / 2),

                parameters = 'toolbar=0,status=0,width=' + popup_width + ',height=' + popup_height + ',top=' + top + ',left=' + left,

                authWindow = window.open(url, '', parameters),

                self = this;

            (function windowClosed() {
                if (!authWindow || authWindow.closed) {
                    $(document)
                        .trigger({
                            type : 'closeAuth',
                            service : self.name
                        });
                } else {
                    setTimeout(windowClosed, 500);
                }
            }());
        },

        save : function () {
            var services = JSON.parse(localStorage.getItem('services')) || {};

            services[this.name] = {
                tokens : this.tokens,
                user : this.user,
                enableContext : this.enableContext
            };

            localStorage.setItem('services', JSON.stringify(services));

            chrome.runtime.sendMessage({
                updateService : true,
                service : this.name
            });
        },

        update : function () {
            var services = JSON.parse(localStorage.getItem('services')) || {};

            if (services[this.name]) {
                this.tokens = services[this.name].tokens;
                this.user = services[this.name].user;
                this.enableContext = services[this.name].enableContext;
            }
        },

        disconnect : function () {
            this.tokens = {};
            this.user = {};

            this.save();
        },

        trigger : function (type, taskId, text) {
            $(document)
                .trigger({
                    type : type,
                    service : this.name,
                    taskId : taskId,
                    text : text
                });
        }

    };

    return Service;
});
