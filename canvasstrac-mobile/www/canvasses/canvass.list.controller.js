/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('CanvassListController', CanvassListController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

CanvassListController.$inject = ['$scope', '$ionicModal', '$ionicPopover', '$ionicHistory', '$timeout', '$state',
  'canvassFactory',
  'loginFactory', 'authFactory', 'storeFactory', 'pagerFactory', 'consoleService', 'navService', 'STATES', 'RES', 'USER', 'CONFIG', 'SHOWDEVDBG'];
function CanvassListController($scope, $ionicModal, $ionicPopover, $ionicHistory, $timeout, $state,
  canvassFactory,
  loginFactory, authFactory, storeFactory, pagerFactory, consoleService, navService, STATES, RES, USER, CONFIG, SHOWDEVDBG) {

  var con = consoleService.getLogger('CanvassListController');

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicView.enter', function(e) {

    navService.dumpHistory();

    //var xx = $ionicHistory.viewHistory();

    //$ionicHistory.clearHistory();  // clear prev history

    //xx = $ionicHistory.viewHistory();
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
    scope: $scope
  });

  $scope.pager = $scope[RES.CANVASS_LIST].pager;

  $scope.errormessage = '';

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.setCanvass = setCanvass;

  /* function implementation
    -------------------------- */

  function setCanvass (canvass) {
    loginFactory.requestAssignment(USER.id, canvass._id,
      authFactory.isAuthenticated,    // queryProcess
      function () {                   // onSuccess
        $state.go(STATES.HOME);
      },
      function () {                   // onFailure
        // TODO display error
      });
  }

}


