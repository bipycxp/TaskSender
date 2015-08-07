/*global $, Service, define */
/*jslint browser: true */

define(['jquery', 'Service'], function ($, Service) {
    'use strict';

    var Asana = function () {

        this.client_id = '43545390699029';
        this.client_secret = '';
        this.redirect_uri = 'https://app.asana.com/robots.txt';

        this.name = 'asana';
        this.sendTo = 'Personal Projects';

        Service.apply(this, arguments);
    };

    Asana.prototype = {

        auth : function () {
            var url = 'https://app.asana.com/-/oauth_authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type={response_type}&state={state}'
                .replace('{client_id}', this.client_id)
                .replace('{redirect_uri}', this.redirect_uri)
                .replace('{response_type}', 'code')
                .replace('{state}', this.randomString());

            this.openWindow(url);
        },

        getToken : function (object) {
            var self = this,
                data = {
                    client_id : this.client_id,
                    client_secret : this.client_secret,
                    redirect_uri : this.redirect_uri
                };

            if (object.refresh) {
                data.grant_type = 'refresh_token';
                data.refresh_token = this.tokens.refresh;
            } else {
                data.grant_type = 'authorization_code';
                data.code = object.code;
            }

            $.ajax({
                url : 'https://app.asana.com/-/oauth_token',
                data : data,
                type : 'POST',
                success : function (response) {
                    self.tokens.access = response.access_token;

                    if (response.refresh_token) {
                        self.tokens.refresh = response.refresh_token;
                    }

                    self.save();

                    if (object.callback) {
                        object.callback();
                    }

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
                url : 'https://app.asana.com/api/1.0/users/me',
                headers : {
                    Authorization : 'Bearer ' + this.tokens.access
                },
                type : 'GET',
                success : function (response) {
                    var i;

                    self.user = {
                        name : response.data.name,
                        avatar : response.data.photo ? response.data.photo.image_128x128 : self.defaultAvatar,
                        workspace : null
                    };

                    for (i = 0; i < response.data.workspaces.length; i += 1) {
                        if (response.data.workspaces[i].name === 'Personal Projects') {
                            self.user.workspace = response.data.workspaces[i].id;
                        }
                    }

                    self.save();

                    self.trigger('successGetUser');
                },
                error : function (response) {
                    if (response.status === 401) {
                        if (self.tokens.refresh) {

                            self.getToken({
                                refresh : true
                            });

                        } else {

                            self.openSettings();

                        }
                    } else {

                        self.trigger('errorGetUser');

                    }
                }
            });
        },

        sendTask : function (content, taskId) {
            if (!content) {
                return false;
            }

            taskId = taskId || Math.random().toString();

            var self = this;

            if (!this.tokens.access) {
                this.openSettings();

                return false;
            }

            this.trigger('startSendTask', taskId, content);

            $.ajax({
                url : 'https://app.asana.com/api/1.0/tasks',
                headers : {
                    Authorization : 'Bearer ' + this.tokens.access
                },
                data : {
                    name : content,
                    workspace : this.user.workspace,
                    assignee : 'me'
                },
                type : 'POST',
                success : function () {
                    self.trigger('successSendTask', taskId, content);
                },
                error : function (response) {
                    if (response.status === 401) {
                        if (self.tokens.refresh) {

                            self.getToken({
                                refresh : true,
                                callback : function () {
                                    self.sendTask(content, taskId);
                                }
                            });

                        } else {

                            self.openSettings();

                        }
                    } else {

                        self.trigger('errorSendTask', taskId, content);

                    }
                }
            });
        }

    };

    Asana.prototype = $.extend({}, Object.create(Service.prototype), Object.create(Asana.prototype));

    return Asana;
});
