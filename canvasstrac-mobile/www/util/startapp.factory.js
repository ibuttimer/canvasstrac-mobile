/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .factory('startAppFactory', startAppFactory);

startAppFactory.$inject = ['$ionicPlatform', 'PLATFORM'];

function startAppFactory ($ionicPlatform, PLATFORM) {

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  var factory = {
    hasGoogleMapsApp: hasGoogleMapsApp,
    launchGoogleMapsApp: launchGoogleMapsApp
    
  };
  
  return factory;

  /* function implementation
    -------------------------- */

  function hasGoogleMapsApp (onSuccess, onFailure) {
    // check availability of apps using https://github.com/lampaa/com.lampa.startapp
    var sApp = startApp.set({ /* params */
      package: PLATFORM[cordova.platformId].MAPS_PACKAGE,
      intentstart: "startActivity"
    }, { /* extras */
      // none
    });
    sApp.check(function (values) { /* success */
      //console.log(values);
      if (onSuccess) {
        onSuccess(values);
      }
    }, function (error) { /* fail */
      //console.log(error);
      if (onFailure) {
        onFailure(error);
      }
    });
  }

  function launchGoogleMapsApp (uri, onSuccess, onFailure) {
    // launch google maps app using https://github.com/lampaa/com.lampa.startapp
    var sApp = startApp.set({ /* params */
      action:'ACTION_VIEW',
      package: PLATFORM[cordova.platformId].MAPS_PACKAGE,
      uri: uri,
      intentstart: 'startActivity'
    }, { /* extras */
      // none
    });

    sApp.start(function () { /* success */
      if (onSuccess) {
        onSuccess();
      }
    }, function (error) { /* fail */
      if (onFailure) {
        onFailure(error);
      }
    });
  }
}

