/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('CanvassController', CanvassController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

CanvassController.$inject = ['$scope', '$ionicModal', '$ionicPopover', '$ionicPopup', '$timeout', '$state',
  'canvassFactory',
  'loginFactory', 'userFactory', 'addressFactory', 'storeFactory', 'pagerFactory', 'mapsFactory', 'startAppFactory',
  'consoleService', 'navService', 'STATES', 'RES', 'USER', 'CONFIG'];
function CanvassController($scope, $ionicModal, $ionicPopover, $ionicPopup, $timeout, $state,
  canvassFactory,
  loginFactory, userFactory, addressFactory, storeFactory, pagerFactory, mapsFactory, startAppFactory,
  consoleService, navService, STATES, RES, USER, CONFIG) {

  var con = consoleService.getLogger('CanvassController');

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicView.enter', function (event, data) {
    // noop
    //navService.dumpHistory('CanvassController');  // just for dev
  });

  $scope.user = USER;

  $scope.perPageOpt = [5, 10, 15, 20];
  $scope.perPage = 10;

  // update config & retrieve allocated canvasser & address lists
  loginFactory.config({
    perPage: $scope.perPage,
    maxDispPage: 5,
    scope: $scope
  });

  $scope.pager = $scope[RES.ALLOCATED_ADDR].pager;

  $scope.errormessage = '';

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.openPopover = openPopover;
  $scope.closePopover = closePopover;
  $scope.mapAddr = mapAddr;
  $scope.directionsAddr = directionsAddr;
  $scope.canvassAddr = canvassAddr;


  // Create the menu popover that we will use later
  $ionicPopover.fromTemplateUrl('canvasses/popover.menu.html', {
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

  function openPopover ($event, addr) {
    $scope.address = addr;
    $scope.canCanvass = ($scope[RES.ACTIVE_SURVEY]._id !== undefined);

    $scope.popup = $ionicPopup.show({
      templateUrl: 'canvasses/popover.menu.html',
      title: 'Select Action',
      scope: $scope,
      buttons: []
    });

    //$scope.popover.show($event);
  };

  function closePopover () {
    $scope.popup.close(); //close the popup
    //$scope.popover.hide();
  };

  function devModeAddr() {
    // HACK address
    if (CONFIG.DEV_MODE && CONFIG.DEV_ADDR) {
      $scope.address = CONFIG.DEV_ADDR;
    }
  }

  function mapAddr() {
    $scope.closePopover();

    // special dev mode handling
    devModeAddr();

    navService.go(STATES.MAP, { addr: $scope.address });
  }


  function directionsAddr () {
    $scope.closePopover();

    // special dev mode handling
    devModeAddr();

    startAppFactory.hasGoogleMapsApp(
      // success function - have google maps app
      function () {
        startAppFactory.launchGoogleMapsApp(mapsFactory.getNavigationUri($scope.address),
          // success function - launched google maps app
          function () {
            // noop
          },
          // failure function - didn't launched google maps app
          function () {
            directionsWeb();
          });
        },
      // failure function - no google maps app
      function () {
        directionsWeb();
      });
  }

  function directionsWeb() {
    // use google maps website
    // see https://github.com/apache/cordova-plugin-inappbrowser#reference
    var url = mapsFactory.getNavigationUrl($scope.address);
    cordova.InAppBrowser.open(url, '_blank', 'location=yes');
  }

  function canvassAddr() {
    $scope.closePopover();
    navService.go(STATES.CANVASS, { addr: $scope.address });
  }


}


