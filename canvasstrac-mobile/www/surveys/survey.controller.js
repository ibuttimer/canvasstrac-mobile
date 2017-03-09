/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('SurveyController', SurveyController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

SurveyController.$inject = ['$scope', '$stateParams', '$state', '$ionicHistory', 'canvassFactory',
  'loginFactory', 'userFactory', 'canvassResultFactory', 'storeFactory', 'miscUtilFactory', 'questionFactory',
  'consoleService',
  'QUESTIONSCHEMA', 'STATES', 'RES', 'USER', 'PLATFORM', 'CANVASSRES_SCHEMA', 'CONFIG'];
function SurveyController($scope, $stateParams, $state, $ionicHistory, canvassFactory,
  loginFactory, userFactory, canvassResultFactory, storeFactory, miscUtilFactory, questionFactory,
  consoleService,
  QUESTIONSCHEMA, STATES, RES, USER, PLATFORM, CANVASSRES_SCHEMA, CONFIG) {

  var con = consoleService.getLogger('SurveyController');

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.user = USER;

  // update config & retrieve allocated canvasser & address lists
  loginFactory.config({
    scope: $scope
  });

  $scope.addr = $stateParams.addr;
  $scope.result = $stateParams.result;

  init();

  $scope.devmode = CONFIG.DEV_MODE;

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.moveQuestion = moveQuestion;
  $scope.answerIp = answerIp;
  $scope.submitSurveyResponse = submitSurveyResponse;
  if (CONFIG.DEV_MODE) {
    $scope.fakeSurvey = fakeSurvey;
  }


  /* function implementation
    -------------------------- */

  function init () {
    $scope.quesTotal = $scope[RES.ACTIVE_SURVEY].questions.length;
    $scope.answers = [];
    for (var i = 0; i < $scope.quesTotal; ++i) {
      $scope.answers.push({});
    }
    setQuestion(0);
  }

  function moveQuestion(step) {
    if (((step > 0) && ($scope.quesNum < $scope.quesTotal)) ||
          ((step < 0) && ($scope.quesNum > 0))) {
      setQuestion($scope.quesNum + step);
    }
  }

  function setQuestion(num) {
    if ((num >= 0) && (num < $scope.quesTotal)) {
      if ($scope.answer) {
        // save last answer
        $scope.answers[$scope.quesNum] = $scope.answer;
      }

      $scope.question = $scope[RES.SURVEY_QUESTIONS].getFromList(num);
      $scope.quesParam = getQuestionParam($scope.question.type);
      $scope.quesNum = num;

      $scope.answer = $scope.answers[num];
      if (!$scope.answer) {
        $scope.answer = {};
      }
      answerIp();
    }
  }

  function getQuestionParam (type) {
    return {
      showSingleSelOptions: questionFactory.showQuestionSingleSelOptions(type),
      showMultiSelOptions: questionFactory.showQuestionMultiSelOptions(type),
      showRanking: questionFactory.showRankingNumber(type),
      showTextInput: questionFactory.showTextInput(type)
    };
  }

  function answerIp () {
    $scope.answered = false;
    if ($scope.quesParam.showSingleSelOptions) {
      if ($scope.answer.sel) {
        $scope.answered = true;
      }
    } else if ($scope.quesParam.showMultiSelOptions) {
      for (var prop in $scope.answer) {
        if ($scope.answer[prop]) {
          $scope.answered = true;
        }
      }
    } else if ($scope.quesParam.showRanking) {
      if ($scope.answer.rank) {
        $scope.answered = true;
      }
    } else if ($scope.quesParam.showTextInput) {
      if ($scope.answer.comment) {
        $scope.answered = true;
      }
    }

    $scope.allowPrev = ($scope.quesNum > 0);
    $scope.allowNext = ((($scope.quesNum + 1) < $scope.quesTotal) && $scope.answered);

    var all = true;
    for (var i = 0; all && (i < $scope.quesTotal); ++i) {
      all = !miscUtilFactory.isEmpty($scope.answers[i]);
    }
    $scope.answeredAll = all;

  }

  function submitSurveyResponse(button) {

    if (button === 'fake') {
      fakeSurvey();
    }

    var result = $scope.result;

    result.answers = [];
    for (var i = 0; i < $scope.quesTotal; ++i) {
      var question = $scope[RES.SURVEY_QUESTIONS].getFromList(i),
        quesParam = getQuestionParam(question.type),
        answer = $scope.answers[i],
        saveStr = '';
      
      if (quesParam.showSingleSelOptions) {
        saveStr = answer.sel;
      } else if (quesParam.showMultiSelOptions) {
        for (var prop in answer) {
          if (answer[prop]) {
            if (saveStr) {
              saveStr += ',';
            }
            saveStr += prop;
          }
        }
      } else if (quesParam.showRanking) {
        saveStr = answer.rank;
      } else if (quesParam.showTextInput) {
        saveStr = answer.comment;
      }
      
      result.answers.push({ 
        answer: saveStr,
        question: question._id
      });
    }

    // reset the form as we leave
    init();
    $scope.surveyForm.$setUntouched();
    $scope.surveyForm.$setPristine();

    var prev = $ionicHistory.backView();
    // update previous view's stateParams with the result
    prev.stateParams.result = result;

    $ionicHistory.goBack();  // go to canvass screen
  }

  function fakeSurvey() {
    for (var i = 0; i < $scope.quesTotal; ++i) {
      var question = $scope[RES.SURVEY_QUESTIONS].getFromList(i),
        quesParam = getQuestionParam(question.type),
        answer = $scope.answers[i];

      if (quesParam.showSingleSelOptions) {
        answer.sel = question.options[0];
      } else if (quesParam.showMultiSelOptions) {
        question.options.forEach(function (opt) {
          answer[opt] = true;
        });
      } else if (quesParam.showRanking) {
        answer.rank = Math.floor(((question.rangeMax - question.rangeMin) / 2) + question.rangeMin);
      } else if (quesParam.showTextInput) {
        answer.comment = 'fake comment ' + i;
      }
    }
  }
}


