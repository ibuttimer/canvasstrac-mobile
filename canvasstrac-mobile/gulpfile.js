/// <binding BeforeBuild='default' />
const basePaths = {
    // src: 'www/',
    dest: 'www/',          // app folder
    config: 'config/',
    node_modules: 'node_modules',
    resources: 'resources',
  },
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  print = require('gulp-print').default,
  concat = require('gulp-concat'),
  changed = require('gulp-changed'),
  del = require('del'),
  sass = require('gulp-sass'),
  cleanCss = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  sh = require('shelljs'),
  replace = require('gulp-replace-task'),
  argv = require('yargs')
    .usage('Usage: gulp <command> [options]')
    .command('replace', 'Generate the environment file based on the options from a configuration file')
    .command('sass', 'Run Sass stylesheet preprocessor')
    .command('clean', 'Clean the app files')
    .command('copyvendor', 'Copy vendor files to output')
    .option('e', {
      alias: 'env',
      default: 'localdev',
      describe: 'Specify name of configuration file to use',
      type: 'string'
    })
    .option('c', {
      alias: 'cfgdir',
      default: basePaths.config,
      describe: 'Specify the directory containing the configuration file to use',
      type: 'string'
    })
    .option('f', {
      alias: 'force',
      default: false,
      describe: 'Allow deleting the current working directory and outside',
      type: 'boolean'
    })
    .option('d', {
      alias: 'dryrun',
      default: false,
      describe: 'See what would be deleted',
      type: 'boolean'
    })
    .option('v', {
      alias: 'vendor',
      default: false,
      describe: 'Delete vendor files as well',
      type: 'boolean'
    })
    .help('h')
    .alias('h', 'help')
    .argv,
  production = argv.production,
  path = require('path'),
  fs = require('fs'),
  notify = require('gulp-notify'),
  // use path.posix.join as del requires backslashes and path.join does forward slash on windows
  paths = {
    sass: ['scss/**/*.scss'],
    css_dest: path.posix.join(basePaths.dest, 'css/'),
    vendor: {
      src: basePaths.node_modules,
      dest: path.posix.join(basePaths.dest, 'lib/')
    },
    ionic: {
      src: path.join(basePaths.resources, 'starters-master/ionic1/base/www/lib/ionic'),
      dest: path.join(basePaths.dest, 'lib/')
    },
  };

var environment = {},
  vendorFiles = {
    scriptscss: [
                  [paths.vendor.src, 'angular', '/**/angular*.*'],
                  [paths.vendor.src, 'angular-resource', '/**/angular-resource*.*'],
                  [paths.vendor.src, 'angular-cookies', '/**/angular-cookies.min*.*'],
                  [paths.vendor.src, 'chart.js/dist', '/**/*.*'],
                  [paths.vendor.src, 'angular-chart.js/dist', '/**/*.*'],
                  [paths.vendor.src, 'js-polyfills', '/**/polyfill.min.js'],
                  [paths.vendor.src, 'ionic-native/dist', '/*.js'],
                  [paths.vendor.src, 'font-awesome/css', '/font-awesome*.*'],
                  [paths.vendor.src, 'font-awesome/scss', '/*.*'],
                  [paths.ionic.src, 'js', '/**/ionic.bundle.js'],
                  [paths.ionic.src, 'js', '/**/angular-resource.js'],
                  [paths.ionic.src, '*css', '/**/*.*'],
                  [paths.ionic.src, 'fonts', '/*.*'],
                ]
  };

/* read local environment configuration if it exists */
if (fs.existsSync('.env')) {
  environment = JSON.parse(fs.readFileSync('.env', 'utf8'));
}

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest(paths.css_dest))
    .pipe(cleanCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest(paths.css_dest))
    .on('end', done);
});


gulp.task('replace', async function () {
  // based on http://geekindulgence.com/environment-variables-in-angularjs-and-ionic/

  // Get the environment from the command line
  var env = argv.env || environment.env,
    envfilename = 'app.config.js',
    // Read the settings from the right file
    filename = env + '.json',
    settings = JSON.parse(fs.readFileSync(path.join(argv.cfgdir, filename), 'utf8')),
    flags = fs.readFileSync(path.posix.join(basePaths.config, 'dbgFlags.txt'), 'utf8'),
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
  gulp.src(path.posix.join(basePaths.config, envfilename))
    .pipe(notify({ message: 'Creating ' + envfilename + ' from ' + filename }))
    .pipe(replace({ patterns: patterns }))
    .pipe(gulp.dest(basePaths.dest));
});

gulp.task('copyvendor', function (cb) {
  var err;
  if (!production) {
  
  // TODO need the prints otherwise some files are not copied

    vendorFiles.scriptscss.forEach(element => {
      gulp.src(path.join(element[0], element[1], element[2]))
        .pipe(rename(function (pathIn) {
          var pathOut = {
            dirname: pathIn.dirname,
            basename: pathIn.basename,
            extname: pathIn.extname
          };
          if (pathIn.dirname.startsWith(paths.ionic.src)) {
            // ionic to www/lib/ionic
            pathOut.dirname = path.join('ionic', pathIn.dirname.substring(paths.ionic.src.length))
          } else if (pathIn.dirname.startsWith(paths.vendor.src)) {
            // others to www/lib
            pathOut.dirname = pathIn.dirname.substring(paths.vendor.src.length);
            if (pathOut.dirname.charAt(0) == '\\' || pathOut.dirname.charAt(0) == '/') {
              pathOut.dirname = pathOut.dirname.substring(1);
            }
          }
          return pathOut;
        }))
        .pipe(print())
        .pipe(gulp.dest(paths.vendor.dest))
        .pipe(print(function (filepath) {
          return "Vendor script/css: " + filepath;
        }));
    });
//    .pipe(notify({ message: 'Vendor script/css task complete', onLast: true }));
  } // else nothing to do in production mode
  cb(err); // if err is not null and not undefined, the run will stop, and note that it failed
});


function noTrailingSlash(path) {
  var slashless,
    idx = path.length - 1;
  if (path.lastIndexOf('/') === idx) {
    slashless = path.substring(0, idx);
  } else {
    slashless = path;
  }
  return slashless;
}

// Clean just the app files
gulp.task('clean', async function () {

  const baseDeletePaths = [path.posix.join(basePaths.dest, '**'),  // NOTE this deletes both parent & content!
    '!' + noTrailingSlash(basePaths.dest),    // exclude parent
    '!' + path.posix.join(basePaths.dest, 'canvasstrac-client-common/**')  // exclude common files
  ];
  const exVendorPaths = [
    '!' + path.posix.join(paths.vendor.dest, '**'), // exclude vendor files
  ];
  var toDeletePaths = baseDeletePaths;
  if (argv.vendor == false) {
    toDeletePaths = baseDeletePaths.concat(exVendorPaths)
  }
  console.log('Glob pattern:\n', toDeletePaths.join('\n'));

  const deletedPaths = await del(toDeletePaths, {
      force: argv.force,  // Allow deleting the current working directory and outside
      dryRun: argv.dryrun // See what would be deleted
    });

  if (argv.dryrun) {
    console.log('Files and directories that would be deleted:\n', deletedPaths.join('\n'));
  }
});


/* TODO the build always uses localdev at the moment (for Visual Studio, fine from command line)
  investigate method of passing arguments to build or maybe needs to be done in the after_prepare hook?
*/
gulp.task('default', gulp.series('sass', 'copyvendor'/*, 'replace'*/));


gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
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

gulp.task('install', gulp.series('git-check'));

