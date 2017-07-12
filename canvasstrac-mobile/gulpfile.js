/// <binding BeforeBuild='default' />
var gulp = require('gulp'),
  gutil = require('gulp-util'),
  bower = require('bower'),
  concat = require('gulp-concat'),
  sass = require('gulp-sass'),
  minifyCss = require('gulp-minify-css'),
  rename = require('gulp-rename'),
  sh = require('shelljs'),
  replace = require('gulp-replace-task'),
  argv = require('yargs')
    .usage('Usage: gulp <command> [options]')
    .command('replace', 'Generate the environment file based on the options from a configuration file')
    .command('sass', 'Run Sass stylesheet preprocessor')
    .option('e', {
      alias: 'env',
      default: 'localdev',
      describe: 'Specify name of configuration file to use',
      type: 'string'
    })
    .help('h')
    .alias('h', 'help')
    .argv,
    production = argv.production,
  fs = require('fs'),
  notify = require('gulp-notify');

var paths = {
    sass: ['./scss/**/*.scss']
  },
  basePaths = {
    src: 'www/',
    config: 'config/',
  },
  environment = {};

/* read local environment configuration if it exists */
if (fs.existsSync('.env')) {
  environment = JSON.parse(fs.readFileSync('.env', 'utf8'));
}

/* TODO the build always uses localdev at the moment
  investigate method of passing arguments to build or maybe needs to be done in the after_prepare hook?
*/
gulp.task('default', ['sass'/*, 'replace'*/]);

gulp.task('replace', function () {
  // based on http://geekindulgence.com/environment-variables-in-angularjs-and-ionic/

  // Get the environment from the command line
  var env = argv.env || environment.env || 'localdev',
    envfilename = 'app.config.js',
    // Read the settings from the right file
    filename = env + '.json',
    settings = JSON.parse(fs.readFileSync(basePaths.config + filename, 'utf8')),
    flags = fs.readFileSync(basePaths.config + 'dbgFlags.txt', 'utf8'),
    // basic patterns
    patterns = [],
    keyVal, dfltVal, setDflt;

    [ // server/management app common settings
      { prop: 'baseURL', type: 'str' },
      { prop: 'forceHttps', type: 'bool', dflt: true },
      { prop: 'httpPort', type: 'num' },
      { prop: 'httpsPortOffset', type: 'num' },
      { prop: 'socketTimeout', type: 'num' },
      { prop: 'disableAuth', type: 'bool', dflt: false },
      // client app settings
      { prop: 'mapsApiKey', type: 'str' },
      { prop: 'autoLogout', type: 'num|str' },
      { prop: 'autoLogoutCount', type: 'num|str' },
      { prop: 'tokenRefresh', type: 'num|str' },
      { prop: 'reloadMargin', type: 'num|str' },
      { prop: 'DEV_MODE', type: 'bool', dflt: false },
      { prop: 'DEV_USER1', type: 'str' },
      { prop: 'DEV_PASSWORD1', type: 'str' },
      { prop: 'DEV_USER2', type: 'str' },
      { prop: 'DEV_PASSWORD2', type: 'str' },
      { prop: 'DEV_USER3', type: 'str' },
      { prop: 'DEV_PASSWORD3', type: 'str' },
      { prop: 'DEV_ADDR', type: 'obj' }
    ].forEach(function (key) {
      keyVal = settings[key.prop];
      setDflt = (keyVal === undefined);
      if (!setDflt && (typeof keyVal === 'string')) {
        setDflt = (keyVal.indexOf('@@') === 0); // no replacement in settings file
      }
      if (setDflt) {
        dfltVal = undefined;

        if (key.dflt) {
          dfltVal = key.dflt;
        } else if (key.type.indexOf('num') >= 0) {
          dfltVal = '0';
        } else if (key.type.indexOf('str') >= 0) {
          dfltVal = '';
        } else if (key.type.indexOf('bool') >= 0) {
          dfltVal = false;
        } else if (key.type.indexOf('obj') >= 0) {
          dfltVal = {};
        }
        keyVal = dfltVal;
      }
      patterns.push({ match: key.prop, replacement: keyVal });
    });

  // TODO better method of setting debug options

  // add dbg settings to patterns
  flags.split('\n').forEach(function (key) {
    if (key) {
      var keyText = key.trim();
      if (keyText.length && (keyText.indexOf('#') < 0)) {
        keyVal = settings[keyText] || false;
        patterns.push({ match: keyText, replacement: keyVal });
      }
    }
  });

  // Replace each placeholder with the correct value for the variable.
  gulp.src(basePaths.config + envfilename)
    .pipe(notify({ message: 'Creating ' + envfilename + ' from ' + filename }))
    .pipe(replace({ patterns: patterns }))
    .pipe(gulp.dest(basePaths.src));
});

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
