/*global $, Service, define */
/*jslint browser: true */

define(['jquery', 'Service'], function ($, Service) {
    'use strict';

    var Todoist = function () {

        this.client_id = '677b4bcbceb744a6ac8e5005086ef8ad';
        this.client_secret = '87b412ef0ccf49358e54fd8ac9529cf6';

        this.name = 'todoist';
        this.sendTo = 'Inbox';

        Service.apply(this, arguments);
    };

    Todoist.prototype = {

        auth : function () {
            var url = 'https://todoist.com/oauth/authorize?scope={scope}&client_id={client_id}&state={state}'
                .replace('{scope}', 'task:add')
                .replace('{client_id}', this.client_id)
                .replace('{state}', this.randomString());

            this.openWindow(url);
        },

        getToken : function (object) {
            var self = this;

            $.ajax({
                url : 'https://todoist.com/oauth/access_token',
                data : {
                    client_id : this.client_id,
                    client_secret : this.client_secret,
                    code : object.code
                },
                type : 'POST',
                success : function (response) {
                    self.tokens.access = response.access_token;

                    self.save();

                    self.trigger('successGetToken');
                },
                error : function () {
                    self.trigger('errorGetToken');
                }
            });
        },

        getUser : function () {
            var self = this;

            if (!this.tokens.access) {
                this.openSettings();

                return false;
            }

            $.ajax({
                url : 'https://todoist.com/API/v6/sync',
                data : {
                    token : this.tokens.access,
                    seq_no : 0,
                    seq_no_global : 0,
                    resource_types : '["user"]'
                },
                type : 'GET',
                success : function (response) {
                    self.user = {
                        name : response.User.full_name,
                        avatar : response.User.avatar_s640 || self.defaultAvatar
                    };

                    self.save();

                    self.trigger('successGetUser');
                },
                error : function () {
                    self.trigger('errorGetUser');
                }
            });
        },

        sendTask : function (content) {
            if (!content) {
                return false;
            }

            var self = this,
                taskId = Math.random().toString();

            if (!this.tokens.access) {
                this.openSettings();

                return false;
            }

            this.trigger('startSendTask', taskId, content);

            $.ajax({
                url : 'https://todoist.com/API/v6/add_item',
                data : {
                    token : self.tokens.access,
                    content : content
                },
                type : 'POST',
                success : function () {
                    self.trigger('successSendTask', taskId, content);
                },
                error : function (response) {
                    if (response.responseJSON.error_code === 14) {
                        self.openSettings();
                    } else {
                        self.trigger('errorSendTask', taskId, content);
                    }
                }
            });
        }

    };

    Todoist.prototype = $.extend({}, Object.create(Service.prototype), Object.create(Todoist.prototype));

    return Todoist;
});
