module.exports = function (grunt) {

  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      express: {
        files:  [ 'valhalla-server.js' ],
        tasks:  [ 'express:dev' ],
        options: {
          spawn: false
        }
      }
    },
    express: {
      options: {
        port: 8080
      },
      dev: {
        options: {
          script: 'valhalla-server.js',
          node_env: 'dev'
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
  grunt.registerTask('server', ['express:dev:start', 'watch']);

  // default
  grunt.registerTask('default', ['server']);

};
