var BaseCommand = require('../util/BaseCommand').BaseCommand;

var DebugCommand = Class(BaseCommand, function (supr) {

  this.name = 'debug';
  this.alias = ['release'];
  this.description = 'create a build';

  this.init = function () {
    supr(this, 'init', arguments);

    this.opts
      .describe('simulated', 'build for the devkit simulator')
      .describe('output', 'path where build output is written').alias('output', 'o')
      .describe('server', 'local | inherit | local | production')
      .describe('localServerURL', 'if server is local, overrides default local server URL')
      .describe('debug', 'creates a debug build')
      .describe('scheme', 'debug | release')
      .describe('version', 'override the version provided in the manifest')
  }

  this.showHelp = function (commands, args) {
    supr(this, 'showHelp', arguments);

    process.argv.push('--help');
    this.exec(commands, args);
  }

  this.exec = function (commands, args) {
    var argv = this.opts.argv;

    var build = require('../build');
    var apps = require('../apps');
    var appPath = argv.app || '.';

    if (!argv.target) {
      if (args[0]) {
        // target is first unusued arg
        argv.target = args[0];
      } else {
        // no target found, show help
        argv.help = true;
      }
    }

    if (argv.help) {
      apps.get(appPath, function (err, app) {
        if (err) { return console.log(err); }
        console.log(getHelp(app, argv.target));
      });
    } else {
      build.build(appPath, argv, function (err, res) {
        require('../jvmtools').stop();
      });
    }
  }
});


function getHelp(app, target) {
  if (target) {
    var buildModule = getBuildModule(app, target);
    if (buildModule) {
      return getHelpText(target, buildModule);
    } else {
      if (target) {
       return "The build target " + target + " is not valid (it may not be installed)";
      }

      return "Valid targets are " + Object.keys(getBuildModules(app)).join(', ');
    }
  } else {
    var modules = getBuildModules(app);
    return 'Build Targets:\n\n' + Object.keys(modules).map(function (target) {
      return '  ' + getHelpText(target, modules[target]);
    }).join('\n');
  }
}

function getHelpText(target, buildModule) {
  if (buildModule.opts) {
    return target + ':\n'
      + buildModule.opts.help().replace(/^Options:/, '')
          .split('\n')
          .map(function (line) {
            return '  ' + line;
          })
          .join('\n');
  } else {
    return target + ':\n'
      + "\n  Sorry! No help is available for this build target\n";
  }
}

function getBuildModules(app) {
  var buildModules = {};
  app.getModules().forEach(function (module) {
    Object.keys(module.getBuildTargets()).forEach(function (target) {
      buildModules[target] = module.loadBuildTarget(target);
    });
  });
  return buildModules;
}

function getBuildModule(app, target) {
  var modules = app.getModules();
  for (var i = 0, module; module = modules[i]; ++i) {
    var buildModule = module.loadBuildTarget(target);
    if (buildModule) {
      return buildModule;
    }
  }
}

module.exports = DebugCommand;