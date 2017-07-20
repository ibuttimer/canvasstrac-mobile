/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('HomeController', HomeController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

HomeController.$inject = ['$scope', '$ionicModal', '$timeout', '$state', '$ionicSideMenuDelegate',
  'loginFactory', 'authFactory', 'navService', 'miscUtilFactory',
  'pagerFactory', 'consoleService',
  'STATES', 'RES', 'USER', 'PLATFORM', 'INPROGRESS'];
function HomeController($scope, $ionicModal, $timeout, $state, $ionicSideMenuDelegate,
  loginFactory, authFactory, navService, miscUtilFactory,
  pagerFactory, consoleService,
  STATES, RES, USER, PLATFORM, INPROGRESS) {

  var con = consoleService.getLogger('HomeController');
  
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicView.enter', function (event, data) {
    
    if ($scope.user.authenticated) {
      var startStage,
        changedSel = false,
        canvass;

      if (!loginFactory.STAGES.isProcessStageOrLoggedIn() && $scope.user.fromStore) {
        // user was authenticated from stored credentials, need to request canvass etc. details
        startStage = loginFactory.STAGES.USER_DETAILS;
      } else if (loginFactory.STAGES.isInProcessStage()) {
        // should be canvass selection stage
        startStage = loginFactory.STAGES.nextStage();
      } else if (loginFactory.STAGES.isLoggedIn()) {
        // changed canvass selection stage
        startStage = loginFactory.STAGES.REQ_ASSIGNMENT;
        changedSel = true;
      }
      if (startStage) {
        /* view caching means that when navigating to home, it uses a cached copy of stateParams
           so any update (like adding a canvassId in the $state.go() in CanvassListController) 
           isn't seen here, hence the more complicated mechanism used here.
           Could disable caching on this view but would be a performance hit
        */
        if (!changedSel) {
          canvass = $scope[RES.ACTIVE_CANVASS]._id;
        }
        if (!canvass) {
          // no active canvass, so check of selection
          canvass = miscUtilFactory.findSelected($scope[RES.CANVASS_LIST]);
          if (canvass) {
            canvass = canvass._id;
          }
        }

        finishLogin(startStage, canvass);
      }
    }
  });

  $scope.user = USER;

  $scope.perPageOpt = [5, 10, 15, 20];
  $scope.perPage = 10;

  var MAX_DISP_PAGE = 5;

  // retrieve allocated canvasser & address lists
  loginFactory.config({
    scope: $scope
  });

  $scope.chartLabels = ["Completed", "Pending"];
  chartData([], $scope);
  $scope.chartOptions = {
    legend: {
      display: true
    }
  };

  // just watch the list rather than the whole ResourceList object
  $scope.$watch(RES.ASSIGNED_ADDR + '.list', function (newValue, oldValue, scope) {
    chartData(newValue, scope);
  }, true /* objectEquality */);

  // watch for active canvass changes
  $scope.showCanvassDetails = false;
  $scope.$watch(RES.ACTIVE_CANVASS + '._id', function (newValue, oldValue, scope) {
    if (newValue) {
      scope.showCanvassDetails = true;
    } else {
      scope.showCanvassDetails = false;
    }
  }, true /* objectEquality */);

  // watch for active canvass changes
  //$scope.$watch(function () {
  //  return INPROGRESS;
  //}, function (newValue, oldValue, scope) {


  //  scope.inprogress = newValue;
  //}, true /* objectEquality */);


  navService.registerAppBackButtonAction();

  $scope.errormessage = '';

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.toggleLeftSideMenu = toggleLeftSideMenu;
  $scope.getAssignedText = getAssignedText;
  $scope.formatDate = formatDate;


  /* function implementation
    -------------------------- */

  function chartData(list, scope) {
    var completed = 0,
      pending = 0,
      myCompleted = 0,
      myPending = 0,
      assignmentCnt = 0;

    miscUtilFactory.listForEach(list, function (entry) {
      if (entry.canvassResult) {
        ++completed;
      } else {
        ++pending;
      }
      if (entry.canvasser === USER.id) {
        ++assignmentCnt;
        if (entry.canvassResult) {
          ++myCompleted;
        } else {
          ++myPending;
        }
      }
    });
    scope.overallData = [completed, pending];
    scope.myData = [myCompleted, myPending];
    scope.assignmentCnt = assignmentCnt;
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

  // Finish the login after user authenticated from stored credentials
  function finishLogin(startStage, canvassId) {

    var options = loginFactory.getLoginOptionObject();

    switch (startStage) {
      case loginFactory.STAGES.REQ_ASSIGNMENT:
        // add canvass options
        options.canvassId = canvassId;
        /* fall through */
      case loginFactory.STAGES.REQ_CANVASSES:
        // add user details options
        options.queryProcess = authFactory.isAuthenticated; // don't proceed unless logged in
        options.userId = USER.id;
        /* fall through */
      case loginFactory.STAGES.USER_DETAILS:
        //options.progressUpdate = function (update, stage) {
        //  if (stage === loginFactory.STAGES.PROCESS_ASSIGNMENT) {
        //    $scope.$apply();
        //  }
        //};
        break;
    }

    // do login starting from user details
    loginFactory.doLogin(function (stage) {
      switch (stage) {
        case loginFactory.STAGES.USER_DETAILS:
          options.queryProcess = authFactory.isAuthenticated; // don't proceed unless logged in
          options.userId = USER.id;
          // default onSuccess & onFailure
          break;
        case loginFactory.STAGES.REQ_CANVASSES:
          options.onSuccess = function (response, list) {
            // retrieve canvass success
            var cont = false;
            switch (list.count) {
              case 0: // no canvasses
                shutShop(STATES.HOME);
                break;
              case 1:
                cont = true;
                options.canvassId = list.getFromList(0)._id;
                break;
              default:  // more than one canvasses
                shutShop(STATES.CANVASSLIST);
                break;
            }
            return cont;
          };
          options.onFailure = function (response) {
            // retrieve canvass failed
            shutShop(STATES.HOME);
            return false; // stop processing
          };
          break;
        case loginFactory.STAGES.REQ_ASSIGNMENT:
        case loginFactory.STAGES.PROCESS_ASSIGNMENT:
          options.onSuccess = function (response) {
            // continue processing
            return true;
          };
          break;
        case loginFactory.STAGES.ASSIGNMENT_PROCESSED:
          options.onSuccess = function (response) {
            // process assignment success
            shutShop(STATES.HOME);
            return false; // all done
          };
          break;
      }
      return options;
    }, startStage);
  }



  function shutShop(state) {
    navService.go(state, null, null, {
      historyRoot: true   // The next view should become the root view in its history stack
    });
  }


}


