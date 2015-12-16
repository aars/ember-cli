'use strict';

var chalk    = require('chalk');
var Task     = require('../models/task');
var Watcher  = require('../models/watcher');
var Builder  = require('../models/builder');
var Promise  = require('../ext/promise');

var LiveReloadServer = require('./server/livereload-server');

module.exports = Task.extend({
  run: function(options) {
    this.ui.startProgress(
      chalk.green('Building'), chalk.green('.')
    );

    var builder =new Builder({
        ui: this.ui,
        outputPath: options.outputPath,
        environment: options.environment,
        project: this.project
    });

    var watcher = new Watcher({
      ui: this.ui,
      analytics: this.analytics,
      builder: builder,
      options: options
    });

    var liveReloadServer = new LiveReloadServer({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      watcher: watcher
    });

    return Promise.all([liveReloadServer.start(options)]).then(function() {
      return new Promise(function () {}); // Run until failure or signal to exit
    });
  }
});
