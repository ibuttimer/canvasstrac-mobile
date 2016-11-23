/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .service('navService', navService);


/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

navService.$inject = ['$state', '$ionicHistory', 'consoleService', 'DBG'];

function navService($state, $ionicHistory, consoleService, DBG) {

  this.con = consoleService.getLogger('navService');

  this.goBackTo = function (state) {
    var cidx = $ionicHistory.currentView().index,
      views = $ionicHistory.viewHistory().views,
      vidx = -1;
    for (var prop in views) {
      var view = views[prop];
      if (view.stateName === state) {
        vidx = view.index;
      }
    }
    if (vidx >= 0) {
      var count = vidx - cidx;
      $ionicHistory.goBack(count);
    }
  }

  this.dumpHistory = function () {
    var views = $ionicHistory.viewHistory().views;
    for (var prop in views) {
      var view = views[prop];
      this.con.debug(view.index + ': ' + view.viewId + ' ' + view.stateName);
    }
  }
}



