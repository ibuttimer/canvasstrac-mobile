/*jslint node: true */
/*global angular */
'use strict';

angular.module('canvassTrac')

  .factory('utilFactory', utilFactory);


/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

utilFactory.$inject = [];

function utilFactory() {

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  var factory = {
    getErrorMsg: getErrorMsg
  };

  return factory;

  /* function implementation
    -------------------------- */

  /**
   * Extract the error message from a server response
   * @param {object} response
   * @returns {string} 
   */
  function getErrorMsg(response) {
    var errormessage = '';
    if (response) {
      if (response.data) {
        if (response.data.err) {
          errormessage = response.data.err.message;
        } else if (response.data.message) {
          errormessage = response.data.message;
        }
      } else if (response.status <= 0) {
        // status codes less than -1 are normalized to zero. -1 usually means the request was aborted
        errormessage = 'Request aborted';
      }
    }
    if (!errormessage) {
      errormessage = 'Unknown error';
    }
    return errormessage;
  }

}
