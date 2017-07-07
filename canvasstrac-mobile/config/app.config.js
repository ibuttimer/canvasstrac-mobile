'use strict';

angular.module('ct.config', [])

  .constant('baseURL', (function () {
    // This is the data base url, app pages are handled by ui-router
    var proto = 'http',
      port = @@httpPort,
      url;
    if (@@forceHttps) {
      proto = 'https';
      if (port >= 0) {
        port += @@httpsPortOffset;
      }
    }
    url = proto + '://@@baseURL';
    if (port >= 0) {
      url += ':' + port;
    }
    return url + '/db/';
  })())
  .constant('STATES', (function () {
    return {
      APP: 'app',
      HOME: 'app.home',
      LOGIN: 'app.login',
      CANVASSLIST: 'app.canvasses',
      ADDRESSLIST: 'app.addresses',
      CANVASS: 'app.canvass',
      SURVEY: 'app.survey',
      MAP: 'app.map',
      ABOUT: 'app.about'
    };
  })())
  .constant('CONFIG', (function () {
	  var strDevAddr = '@@DEV_ADDR',
	    devAddr;
	  if (strDevAddr) {
      devAddr = JSON.parse(strDevAddr);
      if (Object.getOwnPropertyNames(devAddr).length === 0) {
        devAddr = undefined;
      }
	  }

    return {
      DEV_MODE: @@DEV_MODE,  // flag to enable dev mode hack/shortcuts etc.
      DEV_USER1: '@@DEV_USER1',
      DEV_PASSWORD1: '@@DEV_PASSWORD1',
      DEV_USER2: '@@DEV_USER2',
      DEV_PASSWORD2: '@@DEV_PASSWORD2',
      DEV_USER3: '@@DEV_USER3',
      DEV_PASSWORD3: '@@DEV_PASSWORD3',
	    DEV_ADDR: devAddr,
      NOAUTH: @@disableAuth,
      MAPSAPIKEY: '@@mapsApiKey',
      AUTOLOGOUT: @@autoLogout,
      AUTOLOGOUTCOUNT: @@autoLogoutCount,
      TOKENREFRESH: @@tokenRefresh,
      RELOADMARGIN: @@reloadMargin
    };
  })())
  .constant('DBG', (function () {

    var dbgObj = {
      isEnabled: function (mod) {
        return this[mod];
      },
      loggerFunc: function (level, mod) {
        if (this[mod]) {
          var args = Array.prototype.slice.call(arguments, 2);
          console[level].apply(console, args.concat(' '));
        }
      },
      log: function (mod) {
        if (this[mod]) {
          var args = Array.prototype.slice.call(arguments, 1);
          console.log.apply(console, args.concat(' '));
        }
      },
      debug: function (mod) {
        if (this[mod]) {
          var args = Array.prototype.slice.call(arguments, 1);
          console.debug.apply(console, args.concat(' '));
        }
      },
      info: function (mod) {
        if (this[mod]) {
          var args = Array.prototype.slice.call(arguments, 1);
          console.info.apply(console, args.concat(' '));
        }
      },
      warn: function (mod) {
        if (this[mod]) {
          var args = Array.prototype.slice.call(arguments, 1);
          console.warn.apply(console, args.concat(' '));
        }
      },
      error: function (mod) {
        if (this[mod]) {
          var args = Array.prototype.slice.call(arguments, 1);
          console.error.apply(console, args.concat(' '));
        }
      }
    };

    // add debug enable flags
    var appenv = {
      // client common flags
      dbgstoreFactory: @@storeFactory,
      dbglocalStore: @@localStore,
      dbgsurveyFactory: @@surveyFactory,
      dbgcanvassFactory: @@canvassFactory,
      dbgelectionFactory: @@electionFactory,
      dbgcanvassAssignmentFactory: @@canvassAssignmentFactory,
      dbgresourceFactory: @@resourceFactory,

      // mobile client app flags
      dbgCanvassController: @@CanvassController,
      dbgCanvassActionController: @@CanvassActionController,
      dbgSurveyController: @@SurveyController,
      dbgLoginController: @@LoginController,
      dbgloginFactory: @@loginFactory,
      dbgHomeController: @@HomeController,
      dbgnavService: @@navService,
    };

    // TODO needs to be updated to something like the mgmt apps way of doing this but just wedge in for now
    Object.getOwnPropertyNames(appenv).forEach(function (prop) {
      if (prop.indexOf('dbg') === 0) {
        dbgObj[prop] = appenv[prop];
      }
    });

    return dbgObj;
  })())
  .constant('RES', (function () {
    return {
      CANVASS_LIST: 'canvassList',                // canvass list name
      ACTIVE_CANVASS: 'activeCanvass',            // canvass object name
      ACTIVE_SURVEY: 'activeSurvey',              // survey object name
      ACTIVE_ELECTION: 'activeElection',          // election object name
      //BACKUP_CANVASS: 'backupCanvass',            // backup canvass object name
      //BACKUP_SURVEY: 'backupSurvey',              // backup survey object name
      //BACKUP_ELECTION: 'backupElection',          // backup election object name
      CANVASS_RESULT:  'canvassResults',          // canvass results object name
      SURVEY_QUESTIONS: 'surveyQuestions',        // survey questions object name

      ASSIGNED_ADDR: 'assignedAddr',              // all addresses assigned to canvass
      //UNASSIGNED_ADDR: 'unassignedAddr',          // addresses not assigned to canvass
      ASSIGNED_CANVASSER: 'assignedCanvasser',    // all canvassers assigned to canvass
      //UNASSIGNED_CANVASSER: 'unassignedCanvasser',// canvassers not assigned to canvass
      ALLOCATED_ADDR: 'allocatedAddr',            // addresses allocated to canvassers in canvass
      ALLOCATED_CANVASSER: 'allocatedCanvasser',  // canvassers with allocated allocated addresses in canvass
      getPagerName: function (base) {
          // eg assignedAddrPager
        return base + 'Pager';
      },
      getFilterName: function (base) {
        // eg assignedAddrFilter
        return base + 'Filter';
      },
      getFilterStrName: function (base) {
        // eg assignedAddrFilterStr
        return base + 'FilterStr';
      }
    };
  })())
;
