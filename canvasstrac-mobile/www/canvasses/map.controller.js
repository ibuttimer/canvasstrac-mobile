/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .controller('MapController', MapController);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/


/* Based on http://www.joshmorony.com/integrating-google-maps-with-an-ionic-application/ */


MapController.$inject = ['$scope', '$state', '$stateParams', '$cordovaGeolocation', 'geocoderFactory', 'mapsFactory', 'MAPS', 'addressFactory'];
function MapController($scope, $state, $stateParams, $cordovaGeolocation, geocoderFactory, mapsFactory, MAPS, addressFactory) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});


  console.log('$stateParams.addr', $stateParams.addr);

  

  if ($stateParams.addr) {

    if ($stateParams.addr.gps) {
      // already have lat/lng so use that 
    } else {
      // lookup lat/lng
      var addr = addressFactory.stringifyAddress($stateParams.addr);

      geocoderFactory.getLatLng(addr,
        function (location, results) {
          var mapOptions = {
            center: location,
            zoom: MAPS.DFLT_ZOOM,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };

          $scope.map = mapsFactory.getMap(document, 'map', mapOptions, {
            //Wait until the map is loaded to add marker
            eventName: 'idle',
            handler: function () {
              mapsFactory.addMarker($scope.map, location, {
                animation: google.maps.Animation.DROP,
              }, addr);
            }
          });
        });

    }



  } else {
    mapsFactory.getCurrentPosition({timeout: 10000, enableHighAccuracy: true},
      // success function
      function (latLng, position) {
        var mapOptions = {
          center: latLng,
          zoom: MAPS.DFLT_ZOOM,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        $scope.map = mapsFactory.getMap(document, 'map', mapOptions, {
          //Wait until the map is loaded to add marker
          eventName: 'idle',
          handler: function () {
            mapsFactory.addMarker($scope.map, latLng, {
              animation: google.maps.Animation.DROP,
            }, 'Here I am!');
          }
        });

      });
  }


}


