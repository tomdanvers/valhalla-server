module.exports = function (grunt) {

  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      express: {
        files:  [ 'valhalla-server.js','valhalla-map/**/*.*'],
        tasks:  [ 'express:local' ],
        options: {
          spawn: false
        }
      }
    },
    express: {
      options: {
        port: 8080
      },
      local: {
        options: {
          script: 'valhalla-server.js',
          node_env: 'local'
        }
      },
      prod: {
        options: {
          script: 'valhalla-server.js',
          node_env: 'production'
        }
      }
    }
  });

  // npm
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // server
  grunt.registerTask('server', ['express:local:start', 'watch']);

  // default
  grunt.registerTask('default', ['server']);

};
