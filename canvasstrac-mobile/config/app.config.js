'use strict';

angular.module('ct.config', [])

  .constant('baseURL', '@@baseURL:@@basePort/')
  .constant('apiKey', '@@apiKey')
  .constant('STATES', (function () {
    return {
      APP: 'app',
      HOME: 'app.home',
      LOGIN: 'app.login',
      CANVASSLIST: 'app.canvasses',
      ADDRESSLIST: 'app.addresses',
      CANVASS: 'app.canvass',
      SURVEY: 'app.survey',
      MAP: 'app.map'
    };
  })())
  .constant('CONFIG', (function () {
    return {
      DEV_MODE: @@DEV_MODE,  // flag to enable dev mode hack/shortcuts etc.
      DEV_USER: '@@DEV_USER',
      DEV_PASSWORD: '@@DEV_PASSWORD'
    };
  })())
  .constant('DBG', (function () {
    return {
      // debug enable flags
      storeFactory: @@storeFactory,
      localStorage: @@localStorage,
      surveyFactory: @@surveyFactory,
      canvassFactory: @@canvassFactory,
      electionFactory: @@electionFactory,
      CanvassController: @@CanvassController,
      CanvassActionController: @@CanvassActionController,
      SurveyController: @@SurveyController,
      navService: @@navService,

      isEnabled: function (mod) {
        return this[mod];
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
