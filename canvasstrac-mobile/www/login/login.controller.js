/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('LoginController', LoginController)

  .directive('logIn', function() {
    return {
      link: function($scope, element) {
        element.on('click', function() {
          $scope.login();
        });
      }
    }
  })

  .directive('logOut', function() {
    return {
      link: function($scope, element) {
        element.on('click', function() {
          $scope.doLogout();
        });
      }
    }
  })

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

LoginController.$inject = ['$scope', '$ionicModal', '$timeout', '$state', 'authFactory', 'canvassFactory',
  'userFactory', 'addressFactory', 'storeFactory', 'loginFactory', 'STATES', 'RES', 'USER', 'CONFIG'];
function LoginController($scope, $ionicModal, $timeout, $state, authFactory, canvassFactory,
  userFactory, addressFactory, storeFactory, loginFactory, STATES, RES, USER, CONFIG) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};
  $scope.user = USER;

  $scope.devmode = CONFIG.DEV_MODE;
  if (CONFIG.DEV_MODE) {
    $scope.devCredentials = devCredentials;
  }

  $scope.errormessage = '';
  loginFactory.setUp();

  $scope.devmode = CONFIG.DEV_MODE;

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.doLogin = doLogin;
  $scope.doLogout = doLogout;
  $scope.closeLogin = closeLogin;
  $scope.login = login;
  if (CONFIG.DEV_MODE) {
    $scope.devCredentials = devCredentials;
  }

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('login/login.html', {
    scope: $scope
  }).then(function (modal) {
    $scope.modal = modal;
  });

  /* function implementation
    -------------------------- */

  // Triggered in the login modal to close it
  function closeLogin () {
    $scope.modal.hide();
  }

  // Open the login modal
  function login () {
    $scope.modal.show();
  }

  // Perform the login action when the user submits the login form
  function doLogin() {
    authFactory.login($scope.loginData,
      // success function
      function (response) {

        // request the details for the authenticated user
        loginFactory.requestUserDetails(USER.id,
          authFactory.isAuthenticated,    // queryProcess
          function () {                   // onSuccess

            // request the canvass addresses assigned to the user
            loginFactory.requestAssignment(USER.id,
              authFactory.isAuthenticated,    // queryProcess
              function () {                   // onSuccess
                //var canvass = canvassFactory.getObj(RES.ACTIVE_CANVASS);
                
                //loginFactory.requestCompletedAssignments(canvass._id, USER.id,
                //  authFactory.isAuthenticated,    // queryProcess
                //  function () {                   // onSuccess
                //    var list = addressFactory.getList(RES.ALLOCATED_ADDR);
                //    console.debug('assignment rsp read:', list);
                //  },
                //  function () {                   // onFailure
                //    // TODO display error
                //  });
              },
              function () {                   // onFailure
                // TODO display error
              });
          },
          function () {                   // onFailure
            // TODO display error
          });

        closeLogin();
        $state.go(STATES.HOME);   // go to home screen

      },
      // failure function
      function (response) {
        $scope.errormessage = '';
        if (response) {
          if (response.data) {
            if (response.data.err) {
              $scope.errormessage = response.data.err.message;
            } else if (response.data.message) {
              $scope.errormessage = response.data.message;
            }
          } else if (response.status <= 0) {
            // status codes less than -1 are normalized to zero. -1 usually means the request was aborted
            $scope.errormessage = 'Request aborted';
          }
        }
      if (!$scope.errormessage) {
        $scope.errormessage = 'Unknown error';
      }
    });
  }

  // Perform the logout action
  function doLogout() {
    // clear any data
    $scope.loginData = {};
    loginFactory.clearData();

    authFactory.logout(function (response) {
      // noop
    });
    $state.go(STATES.HOME);   // go to home screen
  }

  

  // Quick hack for dev mode to enter user credentials
  function devCredentials() {
    // HACK username/password for dev
    $scope.loginData.username = CONFIG.DEV_USER;
    $scope.loginData.password = CONFIG.DEV_PASSWORD;
  }


  function getUser() {

    // TODO doesn't work at the moment as it uses localStorage, need to persist to the file system
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


