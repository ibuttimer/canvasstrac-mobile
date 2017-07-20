/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('CanvassActionController', CanvassActionController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

CanvassActionController.$inject = ['$scope', '$state', '$stateParams', '$ionicNavBarDelegate',
  'loginFactory', 'canvassResultFactory', 'consoleService', 'navService',
  'BACK_PRIORITY', 'STATES', 'RES', 'USER', 'CANVASSRES_SCHEMA'];
function CanvassActionController($scope, $state, $stateParams, $ionicNavBarDelegate,
  loginFactory, canvassResultFactory, consoleService, navService,
  BACK_PRIORITY, STATES, RES, USER, CANVASSRES_SCHEMA) {

  var con = consoleService.getLogger('CanvassActionController'),
    backButtonActionCtrl,
    // All these results are mutually exclusive, so if one exists and isn't its default value, thats it
    quickRspProps = [
      {
        prop: 'dontCanvass',
        dflt: CANVASSRES_SCHEMA.SCHEMA.getDfltValue(CANVASSRES_SCHEMA.IDs.DONTCANVASS),
        transform: 'dc'
      },
      {
        prop: 'tryAgain',
        dflt: CANVASSRES_SCHEMA.SCHEMA.getDfltValue(CANVASSRES_SCHEMA.IDs.TRYAGAIN),
        transform: 'ta'
      },
      {
        prop: 'available',
        dflt: CANVASSRES_SCHEMA.SCHEMA.getDfltValue(CANVASSRES_SCHEMA.IDs.AVAILABLE),
        transform: 'na'
      }
    ];


  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicView.enter', function (event, data) {
    //navService.dumpHistory('CanvassActionController');  // just for dev

    setResult();
  });

  // make range 0 based otherwise input element doesn't display initial value properly
  $scope.supportOffset = (0 - CANVASSRES_SCHEMA.SUPPORT_UNKNOWN);
  $scope.supportUnknown = CANVASSRES_SCHEMA.SUPPORT_UNKNOWN + $scope.supportOffset;
  $scope.supportMin = CANVASSRES_SCHEMA.SUPPORT_MIN + $scope.supportOffset;
  $scope.supportMax = CANVASSRES_SCHEMA.SUPPORT_MAX + $scope.supportOffset;

  $scope.user = USER;
  $scope.addr = $stateParams.addr;

  // update config & retrieve allocated canvasser & address lists
  loginFactory.config({
    scope: $scope
  });

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.submitQuickResponse = submitQuickResponse;
  $scope.cancelCanvass = cancelCanvass;
  $scope.surveyAddr = surveyAddr;

  /* function implementation
    -------------------------- */

  function submitQuickResponse() {
    var result = getBasicResponse();

    tidyUp();

    canvassResultFactory.save('result', result,
      function (response) {
        // success response

        con.debug('resp: ' + con.objToString($scope.addr));

        $scope.addr.canvassResult = response._id;

        $scope[RES.CANVASS_RESULT].addToList(response);

        // update assigned address list
        var addr = $scope[RES.ASSIGNED_ADDR].findInList(function (entry) {
          return (entry._id === $scope.addr._id);
        });
        if (addr) {
          addr.canvassResult = response._id;
        }

        navService.goBackTo(STATES.ADDRESSLIST);  // go to addresses screen
      },
      function (response) {
        // error response
      }
    );
  }

  function tidyUp() {
    // reset form as we leave
    if ($scope.quickResultForm) {
      $scope.quickResultForm.$setUntouched();
      $scope.quickResultForm.$setPristine();
    }
  }

  function cancelCanvass() {
    tidyUp();

    /* if going back more than 1 view, the '$ionicView.leave' event isn't fired, so 
       need to do some custom handling to deregister the back button action */
    navService.goBackTo(STATES.ADDRESSLIST);  // go to addresses screen

    if (backButtonActionCtrl && backButtonActionCtrl.func) {
      backButtonActionCtrl.eventHandler.call(backButtonActionCtrl);
    }
  }

  function getBasicResponse() {
    var result = $scope.result || {};

    result.support = $scope.quickResult.support - $scope.supportOffset; // take away 0 based offset
    result.canvasser = USER.id;
    result.address = $scope.addr._id;
    result.canvass = $scope[RES.ACTIVE_CANVASS]._id;
    if (!result.answers) {
      result.answers = [];
    }

    if ($scope.quickResult.qr) {
      transformResult(result, $scope.quickResult.qr);
    }
    return result;
  }

  function setResult() {
    $scope.result = $stateParams.result;
    if ($scope.result) {
      $scope.quickResult = {
        qr: transformResult($scope.result),
        support: $scope.result.support + $scope.supportOffset
      };
      $scope.surveyPrompt = 'Redo Survey';
    } else {
      $scope.quickResult = {
        qr: undefined,
        support: $scope.supportUnknown
      };
      $scope.surveyPrompt = 'Survey';
    }
    setBackCtrl($scope.result);

    $scope.canSurvey = ($scope[RES.SURVEY_QUESTIONS].count > 0);
  }


  function transformResult(result, qr) {
    var transformed;

    if (qr) {
      transformed = result;
      quickRspProps.forEach(function (prop) {
        var val = prop.dflt;
        if (qr === prop.transform) {
          val = !prop.dflt;
        }
        transformed[prop.prop] = val;
      });
    } else if (result) {
      quickRspProps.forEach(function (prop) {
        if (result.hasOwnProperty(prop.prop)) {
          if (result[prop.prop] !== prop.dflt) {
            transformed = prop.transform;
          }
        }
      });
    }
    return transformed;
  }

  function setBackCtrl(haveSurvey) {
    /* $ionicHistory works a little funny in that returning from the survey actually pushed another 
      canvass entry onto the stack rather than returning to the existing entry, i.e. the stack becomes
      addresses|canvass|survey|canvass. This means that the default back key behaviour is for the app 
      to keep switching between survey & canvass, and not returning to address as would be expected
    */
    if (haveSurvey) { // have survey so override default back key behaviour
      // override default hardware key action
      backButtonActionCtrl = navService.initForBackButtonAction($scope, function (e) {
        // tidy up & back to addresses
        cancelCanvass();
      }, BACK_PRIORITY.view_override, 'CanvassActionController');

      // disable soft back key
      $ionicNavBarDelegate.showBackButton(false);
    } else {
      // allow soft back key
      $ionicNavBarDelegate.showBackButton(true);
    }
  }


  function surveyAddr () {
    navService.go(STATES.SURVEY, { addr: $scope.addr, result: getBasicResponse() });
  }


}


