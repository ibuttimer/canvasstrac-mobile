/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .config(['$provide', 'IONIC_BACK_PRIORITY', function ($provide, IONIC_BACK_PRIORITY) {

    var priority = angular.copy(IONIC_BACK_PRIORITY);
    priority.app_exit = IONIC_BACK_PRIORITY.view + 1; // priority for app exit prompt
    priority.view_override = IONIC_BACK_PRIORITY.view + 2; // 1st priority for any view override
    priority.modal_override = IONIC_BACK_PRIORITY.modal + 1; // 1st priority for any modal override

    $provide.constant('BACK_PRIORITY', priority);
  }])

  .service('navService', navService);


/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

navService.$inject = ['$state', '$rootScope', '$ionicHistory', '$ionicPlatform', '$ionicPopup', 'BACK_PRIORITY', 'consoleService', 'miscUtilFactory', 'USER', 'DBG'];

function navService($state, $rootScope, $ionicHistory, $ionicPlatform, $ionicPopup, BACK_PRIORITY, consoleService, miscUtilFactory, USER, DBG) {

  this.con = consoleService.getLogger('navService');
  this.ionicSoftBack = $rootScope.$ionicGoBack;   // save ref to ionic's soft back button function

  /**
   * Go back to the specified state
   * @param {string} state  State to go back to
   * @param {object} params           A map of the parameters that will be sent to the state
   * @see https://ui-router.github.io/ng1/docs/0.2.10/#/api/ui.router.state.$state
   * @param {object} nextViewOptions  Sets options for the next view
   * @see https://ionicframework.com/docs/v1/api/service/$ionicHistory/
   * @return {number} number of steps back taken
   */
  this.goBackTo = function (state, params, nextViewOptions) {
    var backCount = 0,
      view = this.findInHistory(function (entry) {
      return (entry.stateName === state);
    });

    if (view) {
      var count = view.index - $ionicHistory.currentView().index;
      backCount = this.goBack(count, params, nextViewOptions);
    }
    return backCount;
  };

  /**
   * Get the current history
   * @returns {object} Current history
   */
  this.getCurrentHistory = function () {
    return $ionicHistory.viewHistory().histories[$ionicHistory.currentHistoryId()];
  };

  /**
   * Find an entry in the current history stack
   * @param {function} test Function to use to locate the required entry
   * @returns {object} Required entry or null if not found
   */
  this.findInHistory = function (test) {
    var history = this.getCurrentHistory(),
      view;
    if (history) {
      view = history.stack.find(test);
    }
    return view;
  };

  /**
   * Go back the specified number of steps in the current history
   * @param {number} backCount  Number of steps to go back
   * @param {object} params           A map of the parameters that will be sent to the state
   * @see https://ui-router.github.io/ng1/docs/0.2.10/#/api/ui.router.state.$state
   * @param {object} nextViewOptions  Sets options for the next view
   * @see https://ionicframework.com/docs/v1/api/service/$ionicHistory/
   * @return {number} number of steps back taken
   */
  this.goBack = function (backCount, params, nextViewOptions) {
    if (typeof backCount === 'object') {
      nextViewOptions = params;
      params = backCount;
      backCount = -1;
    }
    this.con.debug('goBack ' + backCount);
    if (backCount < 0) {
      if (miscUtilFactory.isObject(params)) {
        var history = this.getCurrentHistory(),
          idx = ($ionicHistory.currentView().index + backCount);

        if ((idx >= 0) && (idx < history.stack.length)) {
          // update previous view's stateParams
          miscUtilFactory.copyProperties(params, history.stack[idx].stateParams);
        }
      }
      this.nextViewOptions(nextViewOptions);
      $ionicHistory.goBack(backCount);  // go back to view
    }
    return backCount;
  };

  /**
   * Wrapper for ui-router's go function
   * @param {string} to               Absolute state name or relative state path.
   * @param {object} params           A map of the parameters that will be sent to the state
   * @param {object} options          Options object
   * @see https://ui-router.github.io/ng1/docs/0.2.10/#/api/ui.router.state.$state
   * @param {object} nextViewOptions  Sets options for the next view
   * @see https://ionicframework.com/docs/v1/api/service/$ionicHistory/
   */
  this.go = function (to, params, options, nextViewOptions) {
    this.nextViewOptions(nextViewOptions);
    $state.go(to, params, options).then(this.dumpHistory.bind(this, 'Go to ' + to));
  };

  /**
   * Wrapper for $ionicHistory's nextViewOptions function
   * @param {object} options  Sets options for the next view
   * @see https://ionicframework.com/docs/v1/api/service/$ionicHistory/
   */
  this.nextViewOptions = function (options) {
    if (miscUtilFactory.isObject(options)) {
      $ionicHistory.nextViewOptions(options);
    }
  };


  /**
   * Initialises a back button control action
   * @param {object} scope
   * @param {function} fn     Called when the back button is pressed, if this listener is the highest priority.
   * @param {number} priority Only the highest priority will execute.
   * @param {*=} actionId     The id to assign this action. Default: a random unique id.
   * @returns {function} A function that, when called, will deregister this backButtonAction.
   * @see http://ionicframework.com/docs/v1/api/service/$ionicPlatform/
   */
  this.initForBackButtonAction = function (scope, fn, priority, actionId) {
    var backButtonActionCtrl = this.getBackButtonActionCtrl();

    // register back button function and save deregister function
    backButtonActionCtrl.func = this.registerBackButtonAction(fn, priority, actionId);
    backButtonActionCtrl.priority = priority;
    backButtonActionCtrl.actionId = actionId;
    // make sure its uninstalled when we leave the view
    scope.$on('$ionicView.leave', backButtonActionCtrl.eventHandler.bind(backButtonActionCtrl));

    return backButtonActionCtrl;
  };

  /**
   * Get standard object for back button control
   * @returns {object}
   */
  this.getBackButtonActionCtrl = function () {
    return {
      func: undefined,   // function provided by $ionicPlatform to deregister a custom back key action
      priority: undefined,  // registered priority
      actionId: undefined,  // id if provided during registeration
      eventHandler: function (e) {  // ionic event handler
        if (this.func) {
          this.func();  // deregister custom action
        }
        this.func = undefined;
      }
    };
  };

  /**
   * Wrapper for $ionicPlatform.registerBackButtonAction
   * @param {function} fn     Called when the back button is pressed, if this listener is the highest priority.
   * @param {number} priority Only the highest priority will execute.
   * @param {*=} actionId     The id to assign this action. Default: a random unique id.
   * @returns {function} A function that, when called, will deregister this backButtonAction.
   * @see http://ionicframework.com/docs/v1/api/service/$ionicPlatform/
   */
  this.registerBackButtonAction = function (fn, priority, actionId) {
    this.con.debug('registerBackButtonAction: ' + priority + ' ' + actionId);
    return $ionicPlatform.registerBackButtonAction(fn, priority, actionId);
  };

  // this is the default ionic soft back function
  //$rootScope.$ionicGoBack = function (backCount) {
  //  $ionicHistory.goBack(backCount);
  //};

  // Triggered when devices with a hardware back button (Android) is clicked by the user
  // This is a Cordova/Phonegap platform specifc method copied from ionic.bundle.js
  this.onHardwareBackButton = function (e) {
    var backView = $ionicHistory.backView();
    if (backView) {
      // there is a back view, go to it
      backView.go();
    } else {
      if (USER.authenticated) {
        // user logged in, so cnfirm exit
        $ionicPopup.confirm({
          title: 'Exit Application',
          template: 'Are you sure you want to exit?',
          cancelText: 'No',
          okText: 'Yes'
        }).then(function(res) {
          if(res) {
            ionic.Platform.exitApp();
          }
        });
      } else {
        // there is no back view, so close the app instead
        ionic.Platform.exitApp();
      }

    }
    e.preventDefault();
    return false;
  }

  /**
   * Register the app-specific back button action, overriding the default
   * @returns {function} A function that, when called, will deregister this backButtonAction.
   * @see http://ionicframework.com/docs/v1/api/service/$ionicPlatform/
   */
  this.registerAppBackButtonAction = function () {
    return this.registerBackButtonAction(this.onHardwareBackButton, BACK_PRIORITY.app_exit, 'app_exit');
  };

  /**
   * Dump the current history
   * @param {string} label  Optional label to display
   */
  this.dumpHistory = function (label) {
    if (this.con.isEnabled()) {
      var viewHistory = $ionicHistory.viewHistory(),
        currentView = $ionicHistory.currentView(),
        backView = $ionicHistory.backView(),
        forwardView = $ionicHistory.forwardView(),
        prop,
        view,
        history,
        marker;

      this.con.debug('--------------------');
      if (label) {
        this.con.debug(label);
      }

      for (prop in viewHistory.histories) {
        history = viewHistory.histories[prop];
        this.con.debug('history ' + history.historyId + ': stack ' + history.stack.length + ' parent ' + history.parentHistoryId);
        history.stack.forEach(function (view) {
          if (view === currentView) {
            marker = 'C';
          } else if (view === backView) {
            marker = 'B';
          } else if (view === forwardView) {
            marker = 'F';
          } else {
            marker = ' ';
          }
          this.con.debug('  ' + marker + ' ' + view.index + ': ' + view.viewId + ' ' + view.stateName + 
                            '  ' + (view.backViewId ? view.backViewId : 'x') + '<- ->' +
                            (view.forwardViewId ? view.forwardViewId : 'x'));
        }, this);
      }

      for (prop in viewHistory.views) {
        view = viewHistory.views[prop];
        this.con.debug('views ' + view.index + ': ' + view.viewId + ' ' + view.stateName);
      }
      this.con.debug('--------------------');
    }
  };
}



