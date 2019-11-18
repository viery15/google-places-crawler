'use strict';

module.exports = function(app) {
    var travelPlanner = require('./controller');

    app.route('/')
        .post(travelPlanner.index);
};