'use strict';

var Promise     = require('../ext/promise');
var path        = require('path');
var Command     = require('../models/command');
var win         = require('../utilities/windows-admin');
var PortFinder  = require('PortFinder');

PortFinder.basePort = 49152;
var getPort = Promise.denodeify(PortFinder.getPort);

module.exports = Command.extend({
  name: 'build',
  description: 'Builds your app and places it into the output path (dist/ by default).',
  aliases: ['b'],

  availableOptions: [
    { name: 'environment',          type: String,   default: 'development', aliases: ['e', { 'dev': 'development' }, { 'prod': 'production' }] },
    { name: 'output-path',          type : path,    default: 'dist/',       aliases: ['o'] },
    { name: 'watch',                type : Boolean, default: false,         aliases: ['w'] },
    { name: 'watcher',              type : String },
    { name: 'ssl',                  type: Boolean,  default: false },
    { name: 'ssl-key',              type: String,   default: 'ssl/server.key' },
    { name: 'ssl-cert',             type: String,   default: 'ssl/server.crt' },
    { name: 'live-reload',          type : Boolean, default: false,         aliases: ['lr', 'reload'] },
    { name: 'live-reload-host',     type : String,                          aliases: ['lrh'],   description: 'Defaults to host' },
    { name: 'live-reload-base-url', type : String,                          aliases: ['lrbu'],  description: 'Defaults to baseURL' },
    { name: 'live-reload-port',     type : Number,                          aliases: ['lrp'],   description: '(Defaults to port number within [49152...65535])' },
  ],

  run: function(commandOptions) {
    var BuildTask  = this.taskFor(commandOptions);

    // Reload without watch doesn't make sense.
    if (commandOptions.liveReload && !commandOptions.watch) {
      commandOptions.watch = true;
    }

    var liveReload = commandOptions.liveReload;
    var host       = commandOptions.liveReloadHost;
    var port       = liveReload && commandOptions.liveReloadPort || getPort({host: host});

    return Promise.all([port]).then(function (liveReloadPort) {
      commandOptions.liveReloadPort = liveReloadPort;

      var buildTask = new BuildTask({
        ui: this.ui,
        analytics: this.analytics,
        project: this.project
      });

      return win.checkWindowsElevation(this.ui).then(function() {
        return buildTask.run(commandOptions);
      });
    }.bind(this));
  },

  taskFor: function(options) {
    if (options.liveReload) {
      return this.tasks.BuildWatchReload;
    } else if (options.watch) {
      return this.tasks.BuildWatch;
    } else {
      return this.tasks.Build;
    }
  }
});
