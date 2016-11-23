/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('CanvassController', CanvassController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

CanvassController.$inject = ['$scope', '$ionicModal', '$ionicPopover', '$ionicHistory', '$timeout', '$state',
  'canvassFactory',
  'loginFactory', 'userFactory', 'addressFactory', 'storeFactory', 'pagerFactory', 'mapsFactory', 'startAppFactory',
  'consoleService', 'navService', 'STATES', 'RES', 'USER'];
function CanvassController($scope, $ionicModal, $ionicPopover, $ionicHistory, $timeout, $state,
  canvassFactory,
  loginFactory, userFactory, addressFactory, storeFactory, pagerFactory, mapsFactory, startAppFactory,
  consoleService, navService, STATES, RES, USER) {

  var con = consoleService.getLogger('CanvassController');

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

  //function setFilter (id, filter, resList) {
  //  // allocatedAddrFilterStr or allocatedCanvasserFilterStr
  //  var filterStr = RES.getFilterStrName(id);
  //  if (!filter) {
  //    filter = resList.factory.newFilter();
  //  }
  //  $scope[filterStr] = filter.toString();

  //  return resList.factory.setFilter(id, filter);
  //}

  function openPopover ($event, addr) {
    $scope.address = addr;
    $scope.popover.show($event);
  };

  function closePopover () {
    $scope.popover.hide();
  };

  function mapAddr () {
    $scope.closePopover();

    // HACK address
    $scope.address = {
      addrLine1: '1 Westbrook Avenue',
      town: 'Balbriggan',
      county: 'Co. Dublin'
    };

    $state.go(STATES.MAP, {addr: $scope.address});
  }


  function directionsWeb() {
    // use google maps website
    // see https://github.com/apache/cordova-plugin-inappbrowser#reference
    var url = mapsFactory.getNavigationUrl($scope.address);
    cordova.InAppBrowser.open(url, '_blank', 'location=yes');
  }

  function directionsAddr () {
    // HACK address
    $scope.address = {
      addrLine1: '1 Westbrook Avenue',
      town: 'Balbriggan',
      county: 'Co. Dublin'
    };

    $scope.closePopover();

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

  function canvassAddr() {
    $scope.closePopover();
    $state.go(STATES.CANVASS, {addr: $scope.address});
  }


}


