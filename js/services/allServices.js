/*global define */

define(['services/Todoist', 'services/Asana'], function (Todoist, Asana) {
    'use strict';
    return {
        todoist : new Todoist(),
        asana : new Asana()
    };
});
