const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const concat = require('gulp-concat');
const template = require('gulp-template');
const webserver = require('gulp-webserver');
const yaml = require('yamljs');

const appConfig = yaml.load('config/app.yml');
const queryPath = appConfig.query_path;

/*
 * Build CSS
 * plus its components required
 */
gulp.task('styles', function () {
  gulp
    .src([
      './node_modules/bulma/css/bulma.css',
      './node_modules/font-awesome/css/font-awesome.css',
      './node_modules/leaflet/dist/leaflet.css',
      './resources/styles/app.css'
    ])
    .pipe(concat('app.css'))
    .pipe(gulp.dest('public/css'));
  gulp
    .src([
      './node_modules/font-awesome/fonts/**/*'
    ])
    .pipe(gulp.dest('public/fonts'));
  gulp
    .src([
      './node_modules/leaflet/dist/images/*'
    ])
    .pipe(gulp.dest('public/css/images'));
})

/*
 * Build JavaScripts
 */
gulp.task('scripts', function () {
  gulp
    .src([
      './node_modules/jquery/dist/jquery.js',
      './node_modules/leaflet/dist/leaflet.js',
      './node_modules/moment/moment.js',
      './node_modules/wellknown/wellknown.js',
      './node_modules/wikidata-query-gui/wikibase/queryService/api/Wikibase.js',
      './node_modules/wikidata-query-gui/wikibase/queryService/api/Sparql.js',
      './node_modules/wikidata-query-gui/wikibase/queryService/ui/resultBrowser/helper/FormatterHelper.js',
      './node_modules/wikidata-query-gui/wikibase/queryService/RdfNamespaces.js',
      './resources/scripts/app.js',
      './resources/scripts/bootstrap.js'
    ])
    .pipe(concat('app.js'))
    .pipe(gulp.dest('public/js'));
});

/*
 * Build HTML Pages
 * plus SPARQL Queries
 */
gulp.task('pages', function () {
  fs.readdir('resources/queries', (err, queryFilenames) => {
    gulp
      .src('./resources/queries/**/*')
      .pipe(gulp.dest('public/' + queryPath));

    gulp
      .src([
        './resources/pages/index.html'
      ])
      .pipe(template({
        app: yaml.load('config/app.yml'),
        query_files: queryFilenames,
        query_path: queryPath
      }))
      .pipe(gulp.dest('public'));
  });
});

/*
 * Default build
 */
gulp.task('default', ['styles', 'scripts', 'pages']);

/*
 * Run development mode
 */
gulp.task('development', ['default'], function () {
  gulp.src('./public')
    .pipe(webserver({ livereload: true }));

  gulp.watch('resources/scripts/**/*.js', ['scripts']);
  gulp.watch('resources/styles/**/*.css', ['styles']);
  gulp.watch(['resources/pages/**/*.html', 'resources/queries/**/*'], ['pages']);
  gulp.watch('config/**/*.yml', ['default']);
});
