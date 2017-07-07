/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('CanvassListController', CanvassListController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

CanvassListController.$inject = ['$scope', '$ionicModal', '$ionicPopover', '$timeout', '$state',
  'miscUtilFactory', 'canvassFactory',
  'loginFactory', 'pagerFactory', 'consoleService', 'navService', 'STATES', 'RES', 'USER', 'CONFIG', 'SHOWDEVDBG'];
function CanvassListController($scope, $ionicModal, $ionicPopover, $timeout, $state,
  miscUtilFactory, canvassFactory,
  loginFactory, pagerFactory, consoleService, navService, STATES, RES, USER, CONFIG, SHOWDEVDBG) {

  var con = consoleService.getLogger('CanvassListController');

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicView.enter', function (event, data) {
    // noop
    //navService.dumpHistory('CanvassListController');  // just for dev

    miscUtilFactory.initSelected($scope[RES.CANVASS_LIST]);

  });

  $scope.user = USER;
  $scope.devmode = CONFIG.DEV_MODE;
  if (CONFIG.DEV_MODE) {
    $scope.showDevDbg = SHOWDEVDBG;
  }

  $scope.perPageOpt = [5, 10, 15, 20];
  $scope.perPage = 10;

  // update config & retrieve allocated canvasser & address lists
  loginFactory.config({
    perPage: $scope.perPage,
    maxDispPage: 5,
    scope: $scope,
    ids: [RES.CANVASS_LIST, RES.ACTIVE_CANVASS]
  });

  $scope.pager = $scope[RES.CANVASS_LIST].pager;

  $scope.errormessage = '';

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.setCanvass = setCanvass;

  /* function implementation
    -------------------------- */

  function setCanvass(canvass) {

    canvassFactory.initObj(RES.ACTIVE_CANVASS);
    miscUtilFactory.toggleSelection(canvass);

    navService.go(STATES.HOME, {
      canvassId: canvass._id  // this doesn't show up in HomeController due to view caching, see comment in HomeController
    }, null, {
      historyRoot: true   // The next view should become the root view in its history stack
    });
  }

}


