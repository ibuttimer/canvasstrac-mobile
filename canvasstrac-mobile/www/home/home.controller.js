/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('HomeController', HomeController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

HomeController.$inject = ['$scope', '$ionicModal', '$ionicPopover', '$timeout', '$state', '$ionicSideMenuDelegate',
  'canvassFactory', 'surveyFactory', 'electionFactory', 'loginFactory',
  'userFactory', 'addressFactory', 'storeFactory', 'pagerFactory', 'mapsFactory', 'startAppFactory',
  'STATES', 'RES', 'USER', 'PLATFORM'];
function HomeController($scope, $ionicModal, $ionicPopover, $timeout, $state, $ionicSideMenuDelegate,
  canvassFactory, surveyFactory, electionFactory, loginFactory,
  userFactory, addressFactory, storeFactory, pagerFactory, mapsFactory, startAppFactory,
  STATES, RES, USER, PLATFORM) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicView.enter', function(e) {
    // noop
  });

  $scope.user = USER;

  $scope.perPageOpt = [5, 10, 15, 20];
  $scope.perPage = 10;

  var MAX_DISP_PAGE = 5;

  // retrieve allocated canvasser & address lists
  loginFactory.config({
    scope: $scope
  });


  $scope[RES.ALLOCATED_ADDR].addOnChange(chartData);

  $scope.chartLabels = ["Completed", "Pending"];
  $scope.completed = 0;
  $scope.pending = 0;
  //$scope.chartData = [$scope.completed, $scope.pending];
  $scope.chartOptions = {
    legend: {
      display: true
    }
  };


  $scope.errormessage = '';

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.toggleLeftSideMenu = toggleLeftSideMenu;
  $scope.getAssignedText = getAssignedText;
  $scope.formatDate = formatDate;
  //$scope.openPopover = openPopover;
  //$scope.closePopover = closePopover;
  //$scope.mapAddr = mapAddr;
  //$scope.directionsAddr = directionsAddr;


  // Create the menu popover that we will use later
  //$ionicPopover.fromTemplateUrl('canvasses/popover.menu.html', {
  //  scope: $scope
  //}).then(function (popover) {
  //  $scope.popover = popover;
  //});
  ////Cleanup the popover when we're done with it!
  //$scope.$on('$destroy', function () {
  //  $scope.popover.remove();
  //});

  /* function implementation
    -------------------------- */

  function chartData(resList) {
    var completed = 0,
      pending = 0;
    resList.forEachInList(function (entry) {
      if (entry.canvassResult) {
        ++completed;
      } else {
        ++pending;
      }
    });
    $scope.completed = completed;
    $scope.pending = pending;
  }

  function toggleLeftSideMenu () {
    $ionicSideMenuDelegate.toggleLeft();
  }

  function getAssignedText (count) {
    var str;
    if (count > 1) {
      str = count + ' addresses';
    } else if (count <= 0 ) {
      str = 'None';
    } else {
      str = count + ' address';
    }
    return str;
  }

  function formatDate(date) {
    return new Date(date).toDateString();
  }


  function openPopover ($event, addr) {
    $scope.address = addr;
    $scope.popover.show($event);
  };

  function closePopover () {
    $scope.popover.hide();
  };



}


