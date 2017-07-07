/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .value('SETTINGS', {
    allowBrowser: false,
    appversion: ''
  })
  .run(['SETTINGS', '$cordovaAppVersion', function (SETTINGS, $cordovaAppVersion) {
    // can't use inappbrowser until after device ready
    document.addEventListener("deviceready", function () {
      SETTINGS.allowBrowser = true;

      $cordovaAppVersion.getVersionNumber().then(function (version) {
        SETTINGS.appversion = version;
      });
    }, false);
  }])
  .controller('AboutController', AboutController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

AboutController.$inject = ['$scope', '$rootScope', '$cordovaInAppBrowser', '$ionicPopover', '$cordovaAppVersion', 'STATES', 'SETTINGS'];
function AboutController($scope, $rootScope, $cordovaInAppBrowser, $ionicPopover, $cordovaAppVersion, STATES, SETTINGS) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicView.enter', function (event, data) {
    $scope.appversion = SETTINGS.appversion;
  });

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.openPopover = openPopover;
  $scope.closePopover = closePopover;

  $scope.showExternal = showExternal;

  // Create the menu popover that we will use later
  $ionicPopover.fromTemplateUrl('about/inprogress.popover.html', {
    scope: $scope
  }).then(function (popover) {
    $scope.popover = popover;
  });
  //Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function () {
    $scope.popover.remove();
  });

  /* function implementation
    -------------------------- */

  function openPopover ($event) {
    $scope.title = 'hi';
    $scope.inprogress = true;
    $scope.message = 'Loading please wait ...';

    $scope.popover.show($event);
  };

  function closePopover () {
    $scope.popover.hide();
  };

  function showExternal($event, url) {

    if (SETTINGS.allowBrowser) {
      $cordovaInAppBrowser.open(url, '_blank', {
        location: 'yes'
      });

      $rootScope.$on('$cordovaInAppBrowser:loadstart', function (e, event) {
        // noop
      });

      $rootScope.$on('$cordovaInAppBrowser:loadstop', function (e, event) {

        // insert CSS via code / file
        //$cordovaInAppBrowser.insertCSS({
        //  code: 'body {background-color:blue;}'
        //});

        // insert Javascript via code / file
        //$cordovaInAppBrowser.executeScript({
        //  file: 'script.js'
        //});
      });

      $rootScope.$on('$cordovaInAppBrowser:loaderror', function (e, event) {

        closePopover();
      });
    }
  }

}