/*jslint node: true */
'use strict';

angular.module('canvassTrac', ['ionic', 'ct.config', 'ct.clientCommon', 'ngCordova', 'chart.js'])

  .config(function ($stateProvider, $urlRouterProvider, STATES) {

    var appPath = '/app',
      homePath = '/home',
      loginPath = '/login',
      addressesPath = '/addresses',
      canvassPath = '/canvass',
      surveyPath = '/survey',
      playlistsPath = '/playlists',
      mapPath = '/map',
      otherwisePath = appPath + homePath;

    $stateProvider

    .state(STATES.APP, {
      url: appPath,
      abstract: true,
      templateUrl: 'nav/menu.html',
      controller: 'LoginController'
    })

    .state(STATES.HOME, {
      url: homePath,
      views: {
        'menuContent': {
          templateUrl: 'home/home.html',
          controller: 'HomeController'
        }
      }
    })

    .state(STATES.LOGIN, {
      url: loginPath,
      views: {
        'menuContent': {
          templateUrl: 'login/login.html',
          controller: 'LoginController'
        }
      }
    })

    .state(STATES.ADDRESSLIST, {
      url: addressesPath,
      views: {
        'menuContent': {
          templateUrl: 'canvasses/address.list.html',
          controller: 'CanvassController'
        }
      }
    })

    .state(STATES.CANVASS, {
      url: canvassPath,
      views: {
        'menuContent': {
          templateUrl: 'canvasses/canvass.action.html',
          controller: 'CanvassActionController'
        }
      },
      params: {
        addr: { value: null },
        result: { value: null }
      }
    })

    .state(STATES.SURVEY, {
      url: surveyPath,
      views: {
        'menuContent': {
          templateUrl: 'surveys/survey.html',
          controller: 'SurveyController'
        }
      },
      params: {
        addr: { value: null },
        result: { value: null }
      }
    })

    .state(STATES.MAP, {
      url: mapPath,
      views: {
        'menuContent': {
          templateUrl: 'canvasses/map.html',
          controller: 'MapController',
        }
      },
      params: {
        addr: { value: null }
      }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise(otherwisePath);
  })

  .run(function ($ionicPlatform, $rootScope, $ionicLoading, storeFactory, PLATFORM) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (cordova.platformId === 'ios' && window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      // don't run if not android, as currently only supporting android
      if (!ionic.Platform.isAndroid() /*PLATFORM.isAndroid(device.platform) */) {
        throw new Error('Unsupported platform: ' + device.platform);
      }
    });

  });
