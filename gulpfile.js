var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('watch', function () {
  nodemon({
    script: 'server.js',
    ext: 'js',
    env: { 'NODE_ENV': 'development' }
  })
})
