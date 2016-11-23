/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('CanvassActionController', CanvassActionController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

CanvassActionController.$inject = ['$scope', '$state', '$stateParams', '$ionicHistory',
  'loginFactory', 'canvassResultFactory', 'consoleService', 'navService',
  'STATES', 'RES', 'USER', 'CANVASSRES_SCHEMA'];
function CanvassActionController($scope, $state, $stateParams, $ionicHistory,
  loginFactory, canvassResultFactory, consoleService, navService,
  STATES, RES, USER, CANVASSRES_SCHEMA) {

  var con = consoleService.getLogger('CanvassActionController');


  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicview.enter', function (e) {
    navService.dumpHistory();
  });

  // make range 0 based otherwise input element doesn't display initial value properly
  $scope.supportOffset = (0 - CANVASSRES_SCHEMA.SUPPORT_UNKNOWN);
  $scope.supportUnknown = CANVASSRES_SCHEMA.SUPPORT_UNKNOWN + $scope.supportOffset;
  $scope.supportMin = CANVASSRES_SCHEMA.SUPPORT_MIN + $scope.supportOffset;
  $scope.supportMax = CANVASSRES_SCHEMA.SUPPORT_MAX + $scope.supportOffset;

  $scope.user = USER;
  $scope.addr = $stateParams.addr;

  $scope.result = $stateParams.result;
  if ($scope.result) {
    $scope.quickResult = {
      qr: transformResult($scope.result),
      support: $scope.result.support + $scope.supportOffset
    };
  } else {
    $scope.quickResult = {
      qr: undefined,
      support: $scope.supportUnknown
    };
  }

  // update config & retrieve allocated canvasser & address lists
  loginFactory.config({
    scope: $scope
  });

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.submitQuickResponse = submitQuickResponse;
  $scope.surveyAddr = surveyAddr;

  /* function implementation
    -------------------------- */

  function submitQuickResponse() {
    var result = getBasicResponse();

    // reset form as we leave
    $scope.quickResultForm.$setUntouched();
    $scope.quickResultForm.$setPristine();

    canvassResultFactory.getCanvassResult().save(result,
      function (response) {
        // success response

        con.debug('resp: ' + con.objToString($scope.addr));

        // TODO addrList.exeChanged();

        $scope.addr.canvassResult = response._id;

        $scope[RES.CANVASS_RESULT].addToList(response);

        navService.goBackTo(STATES.ADDRESSLIST);  // go to addresses screen
      },
      function (response) {
        // error response
      }
    );
  }

  function getBasicResponse() {
    var result = $scope.result || {};

    result.support = $scope.quickResult.support - $scope.supportOffset; // take away 0 based offset
    result.canvasser = USER.id;
    result.address = $scope.addr._id;
    result.canvass = $scope[RES.ACTIVE_CANVASS]._id;

    if ($scope.quickResult.qr) {
      transformResult(result, $scope.quickResult.qr);
    }
    return result;
  }

  function transformResult(result, qr) {
    // All these results are multually exclusive, so if one exists and isn't its default value thats it
    var transformed,
      props = [
        { prop: 'dontCanvass', 
          dflt: CANVASSRES_SCHEMA.SCHEMA.getDfltValue(CANVASSRES_SCHEMA.IDs.DONTCANVASS), 
          transform: 'dc' },
        { prop: 'tryAgain', 
          dflt: CANVASSRES_SCHEMA.SCHEMA.getDfltValue(CANVASSRES_SCHEMA.IDs.TRYAGAIN),
          transform: 'ta' }, 
        { prop: 'available', 
          dflt: CANVASSRES_SCHEMA.SCHEMA.getDfltValue(CANVASSRES_SCHEMA.IDs.AVAILABLE),
          transform: 'na' }];

    if (qr) {
      transformed = result;
      props.forEach(function (prop) {
        var val = prop.dflt;
        if (qr === prop.transform) {
          val = !prop.dflt;
        }
        transformed[prop.prop] = val;
      });
    } else if (result) {
      props.forEach(function (prop) {
        if (result.hasOwnProperty(prop.prop)) {
          if (result[prop.prop] != prop.dflt) {
            transformed = prop.transform;
          }
        }
      });
    }
    return transformed;
  }

  function surveyAddr () {
    $state.go(STATES.SURVEY, { addr: $scope.addr, result: getBasicResponse() });
  }


}


