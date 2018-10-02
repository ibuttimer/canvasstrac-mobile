/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('MapController', MapController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/


/* Based on http://www.joshmorony.com/integrating-google-maps-with-an-ionic-application/ */


MapController.$inject = ['$scope', '$state', '$stateParams', '$ionicPopup', 'geocoderFactory', 'mapsFactory', 'MAPS', 'GEOCODER', 'addressFactory'];
function MapController($scope, $state, $stateParams, $ionicPopup, geocoderFactory, mapsFactory, MAPS, GEOCODER, addressFactory) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(event, data) {
  //});

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  $scope.showMap = true;

  console.log('$stateParams.addr', $stateParams.addr);

  var permissions = cordova.plugins.permissions;
  // can only check one permission at a time
  permissions.checkPermission(permissions.ACCESS_FINE_LOCATION,
    // success function
    function (status) {
      if (status.hasPermission) {
        // have fine location
        mapIt();
      }
      else {
        // don't have fine location, check coarse
        permissions.checkPermission(permissions.ACCESS_COARSE_LOCATION,
          // success function
          function (status) {
            if (status.hasPermission) {
              mapIt();
            }
            else {
              // no location permissions
              openConfirm('Alert', 'Access to the device\'s location services is required for this functionality. Do you wish to grant permission?',
                // success function
                function (res) {
                  permissions.requestPermissions(
                    [permissions.ACCESS_COARSE_LOCATION, permissions.ACCESS_FINE_LOCATION],
                    function (status) {
                      if (status.hasPermission) {
                        mapIt();
                      } else {
                        mapNa();
                      }
                    },
                    mapNa);
                },
                // failure function
                mapNa);
            }
          },
          // failure function
          function (result) {
            mapNa();
          });
      }
    },
    // failure function
    function (result) {
      mapNa();
    });



  function mapIt() {
    if ($stateParams.addr) {

      if ($stateParams.addr.gps) {
        // already have lat/lng so use that 
      } else {
        // lookup lat/lng
        var addr = addressFactory.stringifyAddress($stateParams.addr);

        geocoderFactory.getLatLng(addr,
          // success function
          function (location, results) {
            var mapOptions = {
              center: location,
              zoom: MAPS.DFLT_ZOOM,
              mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            showMap();

            $scope.map = mapsFactory.getMap(document, 'map', mapOptions, {
              //Wait until the map is loaded to add marker
              eventName: 'idle',
              handler: function () {
                mapsFactory.addMarker($scope.map, location, {
                  animation: google.maps.Animation.DROP,
                }, addr);
              }
            });
          },
          // failure function
          function (response) {
            if (response.status !== GEOCODER.OK) {
              var message;
              if (response.error_message) {
                message = response.error_message;
              } else {
                message = 'Map error';
              }
              mapNa({
                title: 'Error',
                message: message
              });
            }
          });
      }
    } else {
      mapsFactory.getCurrentPosition({ timeout: 10000, enableHighAccuracy: true },
        // success function
        function (latLng, position) {
          var mapOptions = {
            center: latLng,
            zoom: MAPS.DFLT_ZOOM,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };

          showMap();

          $scope.map = mapsFactory.getMap(document, 'map', mapOptions, {
            //Wait until the map is loaded to add marker
            eventName: 'idle',
            handler: function () {
              mapsFactory.addMarker($scope.map, latLng, {
                animation: google.maps.Animation.DROP
              }, 'Here I am!');
            }
          });
        });
    }
  }

  function openAlert(title, message) {
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: message
    });

    alertPopup.then(function (res) {
      console.log(message);
    });
  }

  function openConfirm(title, message, okCallback, ngCallback) {
    var confirmPopup = $ionicPopup.confirm({
      title: title,
      template: message
    });

    confirmPopup.then(function (res) {
      if (res) {
        if (okCallback) {
          okCallback(res);
        }
      } else {
        if (ngCallback) {
          ngCallback();
        }
      }
    });
  }

  function mapNa(options) {
    var title = 'Alert';
    var message = 'Map functionality unavailable.';
    if (options) {
      if (options.title) {
        title = options.title;
      }
      if (options.message) {
        message = options.message;
      }
    }
    hideMap();
    openAlert(title, message);
  }

  function showMap() {
    $scope.showMap = true;
  }

  function hideMap() {
    $scope.showMap = false;
  }


}


