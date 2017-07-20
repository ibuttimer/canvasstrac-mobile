/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('LoginController', LoginController)

  .directive('logIn', function() {
    return {
      link: function ($scope, element) {
        element.on('click', function () {
          $scope.login();
        });
      }
    };
  })

  .directive('logOut', function () {
    return {
      link: function ($scope, element) {
        element.on('click', function () {
          $scope.doLogout();
        });
      }
    };
  })

  .directive('devDbg', function () {
    return {
      link: function ($scope, element) {
        element.on('click', function () {
          $scope.doDevDbg();
        });
      }
    };
  })

  .value('SHOWDEVDBG', false)

  .controller('RegisterController', function RegisterController($scope, /*ngDialog,*/ authFactory) {

    // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
    $scope.doRegister = doRegister;

    $scope.register = {};
    $scope.loginData = {};


    /* function implementation
      -------------------------- */

    function doRegister() {
      console.log('Doing registration', $scope.registration);

      authFactory.register($scope.registration);

      //ngDialog.close();
    }
  });

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

LoginController.$inject = ['$scope', '$ionicModal', '$timeout', '$state', 'authFactory', 
  'loginFactory', 'consoleService', 'navService', 'STATES', 'RES', 'USER', 'CONFIG', 'SHOWDEVDBG', 'BACK_PRIORITY'];
function LoginController($scope, $ionicModal, $timeout, $state, authFactory, 
  loginFactory, consoleService, navService, STATES, RES, USER, CONFIG, SHOWDEVDBG, BACK_PRIORITY) {

  var con = consoleService.getLogger('LoginController'),
    backButtonActionCtrl;

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicView.enter', function (event, data) {
    //noop
  });

  // Form data for the login modal
  tidyUp();
  $scope.user = USER;

  $scope.devmode = CONFIG.DEV_MODE;
  if (CONFIG.DEV_MODE) {
    $scope.devCredentials = devCredentials;
    $scope.devUser1 = CONFIG.DEV_USER1;
    $scope.devUser2 = CONFIG.DEV_USER2;
    $scope.devUser3 = CONFIG.DEV_USER3;
    $scope.doDevDbg = doDevDbg;
    doDevDbg(true);
  }

  // setup & config are seperate steps. @see loginFactory.setUp() for details
  loginFactory.setUp();
  loginFactory.config({
    scope: $scope,
    ids: [RES.ACTIVE_CANVASS, RES.CANVASS_LIST]
  });

  $scope.homeUrl = $state.href(STATES.HOME);
  $scope.canvassesUrl = $state.href(STATES.CANVASSLIST);
  $scope.addressUrl = $state.href(STATES.ADDRESSLIST);
  $scope.aboutUrl = $state.href(STATES.ABOUT);

  $scope.showAddressItem = false;
  // watch for active canvass changes
  $scope.$watch(RES.ACTIVE_CANVASS + '._id', function (newValue, oldValue, scope) {
    scope.showAddressItem = scope.user.authenticated && newValue;
  }, true);

  $scope.showCanvassesItem = false;
  // watch for canvass list changes
  $scope.$watch(RES.CANVASS_LIST + '.count', function (newValue, oldValue, scope) {
    scope.showCanvassesItem = scope.user.authenticated && (newValue > 0);
  }, true);

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.doLogin = doLogin;
  $scope.doLogout = doLogout;
  $scope.closeLogin = closeLogin;
  $scope.login = login;
  $scope.loginPossible = loginPossible;

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('login/login.html', {
    scope: $scope
  }).then(function (modal) {
    $scope.modal = modal;
  });


  /* function implementation
    -------------------------- */

  function tidyUp() {
    $scope.loginData = {};
    loginPossible();
    if ($scope.loginForm) {
      $scope.loginForm.$setUntouched();
      $scope.loginForm.$setPristine();
    }
  }

  function shutShop(state, params) {
    params = params || null;

    closeLogin();
    navService.go(state, params, null, {
      historyRoot: true   // The next view should become the root view in its history stack
    });
  }


  // Triggered in the login modal to close it
  function closeLogin() {
    // reset form as we leave
    tidyUp();
    $scope.modal.hide();
    loginFactory.clrErrorMsg();
  
    deregisterBackButtonAction();
  }

  // Triggered in the login modal to close it
  function deregisterBackButtonAction() {
    if (backButtonActionCtrl && backButtonActionCtrl.func) {
      backButtonActionCtrl.eventHandler.call(backButtonActionCtrl);
    }
  }

  // Open the login modal
  function login () {
    $scope.modal.show();

    backButtonActionCtrl = navService.initForBackButtonAction($scope, function (e) {
      closeLogin(); // tidy up form and close login
    }, BACK_PRIORITY.modal_override, 'LoginController');

  }

  function loginPossible() {
    var strOk = true;
    [$scope.loginData.username, $scope.loginData.password].forEach(function (str) {
      if (strOk) {
        strOk = (angular.isString(str) && (str.length > 0));
      }
    });
    $scope.loginEnabled = (strOk && !$scope.inprogress.active);
  }

  // Perform the login action when the user submits the login form
  function doLogin($event) {

    var options = loginFactory.getLoginOptionObject();
    options.loginData = $scope.loginData;

    loginFactory.doLogin(function (stage) {
      switch (stage) {
        case loginFactory.STAGES.LOGIN:
          // default onSuccess & onFailure
          break;
        case loginFactory.STAGES.USER_DETAILS:
          options.queryProcess = authFactory.isAuthenticated; // don't proceed unless logged in
          options.userId = USER.id;
          // default onSuccess & onFailure
          break;
        case loginFactory.STAGES.REQ_CANVASSES:
          options.onSuccess = function (response, list) {
            // retrieve canvass success
            var cont = true;
            switch (list.count) {
              case 0: // no canvasses
                shutShop(STATES.HOME, { canvasses: 0 });
                break;
              case 1:
                options.canvassId = list.getFromList(0)._id;
                break;
              default:  // more than one canvasses
                shutShop(STATES.CANVASSLIST);
                cont = false; // can't process any more atm
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
          options.onSuccess = function (response, list) {
            // process assignment success
            shutShop(STATES.HOME);
            return false; // all done
          };
          break;
      }
      return options;
    });
  }


  // Perform the logout action
  function doLogout() {
    // clear any data
    tidyUp();

    loginFactory.doLogout();
    $state.go(STATES.HOME);   // go to home screen
  }

  // Perform the dev debug action
  function doDevDbg(set) {
    if (set !== undefined) {
      SHOWDEVDBG = set; // set value
    } else {
      SHOWDEVDBG = !SHOWDEVDBG; // toggle value
    }
    $scope.showDevDbg = SHOWDEVDBG;
    if (SHOWDEVDBG) {
      $scope.devDbgAction = 'Hide Debug';
    } else {
      $scope.devDbgAction = 'Show Debug';
    }
  }

  // Quick hack for dev mode to enter user credentials
  function devCredentials(user) {
    // HACK username/password for dev
    if (!$scope.loginData) {
      $scope.loginData = {};
    }
    if (user === CONFIG.DEV_USER1) {
      $scope.loginData.username = CONFIG.DEV_USER1;
      $scope.loginData.password = CONFIG.DEV_PASSWORD1;
    } else if (user === CONFIG.DEV_USER2) {
      $scope.loginData.username = CONFIG.DEV_USER2;
      $scope.loginData.password = CONFIG.DEV_PASSWORD2;
    } else if (user === CONFIG.DEV_USER3) {
      $scope.loginData.username = CONFIG.DEV_USER3;
      $scope.loginData.password = CONFIG.DEV_PASSWORD3;
    }
  }

  function getUser() {

    // TODO doesn't work at the moment as it uses localStore, need to persist to the file system
    //$scope.loginData = authFactory.getUserinfo();

    $scope.loginData = {
      username: authFactory.getUsername(),
      authenticated: authFactory.isAuthenticated()
    };

    console.log('$scope.loginData', $scope.loginData);

    if ($scope.loginData.username) {
      $scope.loginData.rememberMe = true;
    }
  }
}


