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
  args = require('yargs').argv,
  fs = require('fs'),
  notify = require('gulp-notify');

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass', 'replace']);

gulp.task('replace', function () {
  // based on http://geekindulgence.com/environment-variables-in-angularjs-and-ionic/

  // Get the environment from the command line
  var env = args.env || 'localdev';

  // Read the settings from the right file
  var filename = env + '.json';
  var settings = JSON.parse(fs.readFileSync('./config/' + filename, 'utf8'));

  // Replace each placeholder with the correct value for the variable.  
  gulp.src('./config/app.config.js')
  .pipe(replace({
    patterns: [ { match: 'baseURL', replacement: settings.baseURL },
        { match: 'basePort',  replacement: settings.basePort },
        { match: 'apiKey', replacement: settings.apiKey },
        { match: 'DEV_MODE', replacement: settings.DEV_MODE },
        { match: 'DEV_USER', replacement: settings.DEV_USER },
        { match: 'DEV_PASSWORD', replacement: settings.DEV_PASSWORD }
      ]
    }))
    .pipe(gulp.dest('www'));
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
