/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('NoticeController', NoticeController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

NoticeController.$inject = ['$scope', '$ionicModal', '$timeout', '$state', '$ionicSideMenuDelegate',
  'loginFactory', 'authFactory', 'navService', 'miscUtilFactory',
  'pagerFactory', 'consoleService', 'noticeFactory',
  'STATES', 'RES', 'USER', 'PLATFORM', 'INPROGRESS'];
function NoticeController($scope, $ionicModal, $timeout, $state, $ionicSideMenuDelegate,
  loginFactory, authFactory, navService, miscUtilFactory,
  pagerFactory, consoleService, noticeFactory,
  STATES, RES, USER, PLATFORM, INPROGRESS) {

  var con = consoleService.getLogger('NoticeController');

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicView.enter', function (event, data) {

    getNotices();
  });

  $scope.$on('$ionicView.leave', function (event, data) {

    loginFactory.initInProgress();
  });

  $scope.errormessage = '';

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.levelToStyle = levelToStyle;
  $scope.levelToIcon = levelToIcon;


  /* function implementation
    -------------------------- */

  function getNotices() {

    loginFactory.updateInProgress('Retrieving notices');

    $scope.notices = noticeFactory.query('current',
      // success function
      function (response) {
        // response is actual data
        $scope.notices = response;
        loginFactory.initInProgress();
      },
      // error function
      function (response) {
        // noop
        loginFactory.setErrorMsg(response);
      }
    );
  }

  function levelToStyle(level) {
    /* need to use custom .card classes rather as the bootstrap background colours are overwritten */
    return 'card-' + noticeFactory.getNoticeTypeObj(level, 'style');
  }

  function levelToIcon(level) {
    return noticeFactory.getNoticeTypeObj(level, 'icon');
  }

}


