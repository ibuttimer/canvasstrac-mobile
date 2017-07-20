/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .constant('LABELS', (function () {
    return ['label-primary',
      'label-success',
      'label-info',
      'label-warning',
      'label-danger'
    ];
  })())
  .value('LABELIDX', 0)
  .value('INPROGRESS', {
    errormessage: '',
    active: false,
    progressmsg: '',
    stage: -1 // i.e. STAGES.LOGGED_OUT
  })
  .factory('loginFactory', loginFactory);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

loginFactory.$inject = ['$injector', '$q', '$timeout', 'authFactory', 'canvassFactory', 'surveyFactory', 'canvassAssignmentFactory', 'canvassResultFactory', 'pagerFactory',
  'userFactory', 'addressFactory', 'electionFactory', 'questionFactory', 'storeFactory', 'resourceFactory', 'miscUtilFactory', 'utilFactory', 'consoleService',
  'STATES', 'RES', 'USER', 'SCHEMA_CONST', 'RESOURCE_CONST', 'CANVASSSCHEMA', 'SURVEYSCHEMA', 'CANVASSRES_SCHEMA', 'CANVASSASSIGN_SCHEMA', 'LABELS', 'LABELIDX', 'INPROGRESS'];
function loginFactory($injector, $q, $timeout, authFactory, canvassFactory, surveyFactory, canvassAssignmentFactory, canvassResultFactory, pagerFactory,
  userFactory, addressFactory, electionFactory, questionFactory, storeFactory, resourceFactory, miscUtilFactory, utilFactory, consoleService,
  STATES, RES, USER, SCHEMA_CONST, RESOURCE_CONST, CANVASSSCHEMA, SURVEYSCHEMA, CANVASSRES_SCHEMA, CANVASSASSIGN_SCHEMA, LABELS, LABELIDX, INPROGRESS) {

  var con = consoleService.getLogger('loginFactory');

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  var 
    // Note: must be sequential & in order
    LOGGED_OUT = -1,
    LOGIN = 0,
    USER_DETAILS = 1,
    REQ_CANVASSES = 2,
    REQ_ASSIGNMENT = 3,
    PROCESS_ASSIGNMENT = 4,
    ASSIGNMENT_PROCESSED = 5,
    LOGGED_IN = 6,

    factory = {
      setUp: setUp,
      config: config,
      clearData: clearData,
      getDataItem: getDataItem,
      setFilter: setFilter,
      requestUserDetails: requestUserDetails,
      requestCanvasses: requestCanvasses,
      requestAssignment: requestAssignment,
      requestCompletedAssignments: requestCompletedAssignments,
      processLoginStage: processLoginStage,
      doLogout: doLogout,
      doLogin: doLogin,
      doLoginFromStage: doLoginFromStage,
      getLoginOptionObject: getLoginOptionObject,
      //updateInProgress: updateInProgress,
      clrErrorMsg: clrErrorMsg,
      //setErrorMsg: setErrorMsg,
      //initInProgress: initInProgress,
      STAGES: {
        LOGGED_OUT: LOGGED_OUT,
        LOGIN: LOGIN,
        USER_DETAILS: USER_DETAILS,
        REQ_CANVASSES: REQ_CANVASSES,
        REQ_ASSIGNMENT: REQ_ASSIGNMENT,
        PROCESS_ASSIGNMENT: PROCESS_ASSIGNMENT,
        ASSIGNMENT_PROCESSED: ASSIGNMENT_PROCESSED,
        LOGGED_IN: LOGGED_IN,
        isInProcessStage: isInProcessStage,
        isLoggedIn: isLoggedIn,
        isProcessStageOrLoggedIn: isProcessStageOrLoggedIn,
        currentStage: function () {
          return INPROGRESS.stage;
        },
        nextStage: nextLoginStage
      }
    };

  return factory;

  /* function implementation
    -------------------------- */

  /**
   * Get the list of app data objects/ResourceLists 
   * @returns {Array} 
   */
  function getSetUpList() {
    return [
      { id: RES.CANVASS_LIST, title: 'Canvasses', list: true, factory: canvassFactory },
      { id: RES.ACTIVE_CANVASS, title: '', list: false, factory: canvassFactory },
      { id: RES.ACTIVE_ELECTION, title: '', list: false, factory: electionFactory },
      { id: RES.ASSIGNED_ADDR, title: 'Canvass Addresses', list: true, factory: addressFactory },
      { id: RES.ASSIGNED_CANVASSER, title: 'Canvassers', list: true, factory: userFactory },
      { id: RES.CANVASS_RESULT, title: 'Canvass Results', list: true, factory: canvassResultFactory},

      { id: RES.ACTIVE_SURVEY, title: '', list: false, factory: surveyFactory },
      { id: RES.SURVEY_QUESTIONS, title: 'Survey Questions', list: true, factory: questionFactory },

      { id: RES.ALLOCATED_CANVASSER, title: 'Canvasser', list: false, factory: userFactory },
      { id: RES.ALLOCATED_ADDR, title: 'Canvasser\'s Addresses', list: true, factory: addressFactory }
    ];
  }

  /**
   * Setup objects in a scope
   * @param {object} options  Config options
   *  @see config() for details
   *  NOTE: Making copies of Window or Scope instances is not supported
   */
  function setUp(options) {
    if (!options) {
      options = {};
    }
    var setUpOptions = angular.copy(options);

    if (!options.flags) {
      setUpOptions.flags = storeFactory.CREATE_INIT;
    }

    getSetUpList().forEach(function (entry) {
      setUpOptions.title = entry.title;
      if (entry.list) {
        configList(entry.id, entry.factory, setUpOptions);
      } else {
        configObj(entry.id, entry.factory, setUpOptions);
      }
    });
  }

  /**
   * Configure objects in a scope
   * @param {object} options  Config options as followed:
   *  @param {object} scope       Scope to save references to
   *  @param {number} perPage     Pager items per page
   *  @param {number} maxDispPage Pager max display items per page
   *  @param {array} ids          Ids of objects to configure or all if not included
   */
  function config (options) {
    if (!options) {
      options = {};
    }
    getSetUpList().forEach(function (entry) {
      var proceed = true;
      if (options.ids) {
        proceed = (undefined !== options.ids.find(function (id) {
          return (id === entry.id);
        }));
      }
      if (proceed) {
        if (entry.list) {
          configList(entry.id, entry.factory, options);
        } else {
          configObj(entry.id, entry.factory, options);
        }
      }
    });

    options.scope.inprogress = INPROGRESS;
  }

  /**
   * Initialise all app data objects/ResourceLists 
   */
  function clearData () {
    getSetUpList().forEach(function (entry) {
      if (entry.list) {
        entry.factory.initList(entry.id);
      } else {
        entry.factory.initObj(entry.id);
      }
    });
  }

  /**
   * Get an app data object/ResourceList
   * @param {string} id     Id of item 
   * @param {number} flags  storefactory flags
   * @return {object}
   */
  function getDataItem (id, flags) {
    var item,
      itemEntry = getSetUpList().find(function (entry) {
        return (entry.id === id);
      });
    if (itemEntry) {
      if (itemEntry.list) {
        item = itemEntry.factory.getList(id, flags);
      } else {
        item = itemEntry.factory.getObj(id, flags);
      }
    }
    return item;
  }

  /**
   * Configure a ResourceLsit
   * @param {string} id
   * @param {object} factory
   * @param {number} options
   */
  function configList (id, factory, options) {
    if (!options) {
      options = {};
    }

    var resList,
      filterId = RES.getFilterName(id),
      pagerId = RES.getPagerName(id),
      filter,
      pager,
      create = storeFactory.doCreateAny(options.flags);

    if (create) {
      // create objects
      resList = factory.newList(id, options);
      filter = storeFactory.newObj(filterId, factory.newFilter(), storeFactory.CREATE_INIT);
      pager = pagerFactory.newPager(pagerId, [], 1, options.perPage, options.maxDispPage);

      resList.sortOptions = factory.getSortOptions();
      resList.sortBy = resList.sortOptions[0];

      setFilter(id, filter, resList, options.scope);
      factory.setPager(id, pager);
    } else {
      // retrieve objects
      resList = factory.getList(id);
      filter = resList.filter;
      pager = resList.pager;
    }

    if (!create) {  // updating config
      if (resList && options.title) {
        resList.title = options.title;
      }
      if (pager) {
        if (options.perPage) {
          pager.setPerPage(options.perPage);
        }
        if (options.maxDispPage) {
          pager.setMaxDispPages(options.maxDispPage);
        }
      }
    }

    if (options.scope) {
      // assign to scope
      options.scope[id] = resList;
      options.scope[filterId] = filter;
      options.scope[pagerId] = pager;
    }
  }

  /**
   * Configure an object
   * @param {string} id
   * @param {object} factory
   * @param {number} options
   */
  function configObj(id, factory, options) {
    if (!options) {
      options = {};
    }

    var obj;
    if (storeFactory.doCreateAny(options.flags)) {
      obj = factory.newObj(id, options.flags);
    } else {
      obj = factory.getObj(id, options.flags);
    }
    if (options.scope) {
      // assign to scope
      options.scope[id] = obj;
    }
  }


  function setFilter(id, filter, resList, scope) {
    var filterStr = RES.getFilterStrName(id);
    if (!filter) {
      filter = resList.factory.newFilter();
    }
    if (scope) {
      // assign to scope
      scope[filterStr] = filter.toString();
    }
    return resList.factory.setFilter(id, filter);
  }

  /**
   * Perform a logout
   * @param {function} success  Function to call on success
   * @param {function} failure  Function to call on failure
   */
  function doLogout(success, failure) {
    initInProgress(LOGGED_OUT, 'doLogout');
    clearData();
    authFactory.logout(success, failure);
  }

  /**
   * Perform a login
   * @param {function} processFunc  Function to provide stage options
   * @param {number} start          Stage to start from; one of STAGES
   */
  function doLogin(processFunc, start) {
    if (!start) {
      start = LOGIN;
    }
    doLoginFromStage(start, processFunc);
  }

  /**
   * Perfrom a login started from the specified stage
   * @param {number}   stage        Stage to start from; one of STAGES
   * @param {function} processFunc  Function to probide stage options
   */
  function doLoginFromStage(stage, processFunc, arg0) {
    var promise = processLoginStage(stage, processFunc, arg0);
    if (promise) {
      promise.then(
        function (result) {
          continueLogin(result.nextStage, processFunc, result.arg0);
        },
        function (nextStage) {
          // promise rejected
          if (nextStage === LOGGED_IN) {
            initInProgress(LOGGED_IN, 'promise rejected');
          }
        });
    }
  }

  /**
   * Continue a login started from the specified stage
   * @param {number}   nextStage    Stage to continue from; one of STAGES
   * @param {function} processFunc  Function to probide stage options
   */
  function continueLogin(nextStage, processFunc, arg0) {

    console.log('continueLogin', nextStage);


    // promise resolved successfully
    if (isInProcessStage(nextStage)) {
      doLoginFromStage(nextStage, processFunc, arg0);
    } else {
      INPROGRESS.stage = nextStage;
    }
  }



  /**
   * Get a basic login option object
   * @returns {object} 
   */
  function getLoginOptionObject() {
    return {
      queryProcess: undefined,
      progressUpdate: undefined,
      loginData: undefined,
      userId: undefined,
      canvassId: undefined,
      onSuccess: function () {
        return true;  // continue processing
      },
      onFailure: function (response) {
        return false;  // stop processing
      }
    };
  }

  /**
   * Process a specific login stage
   * @param {number}          stage    Stage to start from; one of STAGES
   * @param {object|function} stageOpt Options for stage or function to get them
   * @returns {object} promise to be resolved. The resolve value will be the next stage to do.
   */
  function processLoginStage(stage, stageOpt, arg0) {
    var queryProcess,
      options,
      progressUpdate,
      onSuccess,
      onFailure,
      promise;


    console.log('processLoginStage', stage);


    if (typeof stageOpt === 'function') {
      options = stageOpt(stage);
    } else {
      options = stageOpt;
    }

    switch (stage) {
      case LOGIN:
      case USER_DETAILS:
      case REQ_CANVASSES:
      case REQ_ASSIGNMENT:
      case PROCESS_ASSIGNMENT:
      case ASSIGNMENT_PROCESSED:
        queryProcess = options.queryProcess || function () {
          return true;
        };
        if (options.progressUpdate) {
          progressUpdate = function (update, stage, dbg) {
            updateInProgress(update, stage, dbg);
            options.progressUpdate(update, stage);
          };
        } else {
          progressUpdate = updateInProgress;
        }
        /**
         * Function to call on success
         * @param {object} response   Server response
         * @param {function} resolve  Promise resolve function
         * @param {function} reject   Promise reject function
         * @param {number} nextStage  Next stage to process in sequence
         * @param {object} arg0       Optional extra argument
         */
        onSuccess = function (response, resolve, reject, nextStage, arg0) {
          // next stage is the resolve result
          promiseRtn(resolve, reject, on(options.onSuccess, response, arg0), {
            nextStage: nextStage,
            arg0: response
          });
        };
        /**
         * Function to call on failure
         * @param {object} response   Server response
         * @param {function} resolve  Promise resolve function
         * @param {function} reject   Promise reject function
         * @param {number} nextStage  Next stage to process in sequence
         */
        onFailure = function (response, resolve, reject, nextStage) {
          setErrorMsg(response);
          // next stage is the reject reason
          promiseRtn(resolve, reject, on(options.onFailure, response), undefined, nextStage);
        };
        break;
      default:
        return false;
    }

    switch (stage) {
      case LOGIN:
        progressUpdate('Logging in', stage, 'LOGIN');

        promise = $q(function (resolve, reject) {
          authFactory.login(options.loginData,
            function (response) {
              // successfully logged in
              onSuccess(response, resolve, reject, USER_DETAILS);
            },
            function (response) {
              // log in failed
              onFailure(response, resolve, reject, stage);
            }
          );
        });
        break;

      case USER_DETAILS:
        progressUpdate('Retrieving user details', stage, 'USER_DETAILS');

        promise = $q(function (resolve, reject) {
          requestUserDetails(options.userId,
            queryProcess,
            function (response) {
              // retrieve user details success
              onSuccess(response, resolve, reject, REQ_CANVASSES);
            },
            function (response) {
              // retrieve user details failed
              onFailure(response, resolve, reject, stage);
            }
          );
        });
        break;

      case REQ_CANVASSES:
        progressUpdate('Retrieving canvass details', stage, 'REQ_CANVASSES');

        // request the canvass addresses assigned to the user
        promise = $q(function (resolve, reject) {
          requestCanvasses(options.userId,
            queryProcess,
            function (response) {   // onSuccess
              // retrieve canvass success
              var canvasses = canvassFactory.getObj(RES.CANVASS_LIST),
                nextStage = (canvasses.count > 0 ? REQ_ASSIGNMENT : ASSIGNMENT_PROCESSED);
              onSuccess(response, resolve, reject, nextStage, canvasses);
            },
            function (response) {
              // retrieve canvass failed
              onFailure(response, resolve, reject, stage);
            }
          );
        });
        break;

      case REQ_ASSIGNMENT:
        progressUpdate('Retrieving assignments', stage, 'REQ_ASSIGNMENT');

        promise = $q(function (resolve, reject) {
          requestAssignment(options.userId, options.canvassId,
            queryProcess,
            function (response) {
              // retrieve assignment success
              onSuccess(response, resolve, reject, PROCESS_ASSIGNMENT);
            },
            function (response) {
              // retrieve assignment failed
              onFailure(response, resolve, reject, stage);
            },
            continueLogin.bind(null, PROCESS_ASSIGNMENT, stageOpt)  // function to call when processing starts
          );
        });
        break;

      case PROCESS_ASSIGNMENT:
        progressUpdate('Processing assignments', stage, 'PROCESS_ASSIGNMENT');

        promise = $q(function (resolve, reject) {
          processAssignment(
            arg0,
            queryProcess,
            function (response) {
              // retrieve assignment success
              onSuccess(response, resolve, reject, ASSIGNMENT_PROCESSED);
            }
          );
        });
        break;

      case ASSIGNMENT_PROCESSED:
        promise = $q(function (resolve, reject) {
          initInProgress(LOGGED_IN, 'ASSIGNMENT_PROCESSED');
          // resolve promise immediately
          onSuccess(null, resolve, reject, LOGGED_IN);
        });
        break;
    }
    return promise;
  }

  /**
   * Check if sequence should continue
   * @param {function}  func      Function to call to check
   * @param {object}    response  Response for func to check
   * @param {object}    arg0      Optional additional argument
   * @returns {boolean} true if sequence should continue
   */
  function on(func, response, arg0) {
    var cont = true;
    if (func) {
      cont = func(response, arg0);
    }
    return cont;
  }

  /**
   * 
   * @param {function}  resolve Promise resolve function
   * @param {function}  reject  Promise reject function
   * @param {boolean}   ok      Resolve/reject flag
   * @param {nnmber}    result  resolve result
   * @param {number}    reason  reject reason
   */
  function promiseRtn (resolve, reject, ok, result, reason) {
    if (ok) {
      resolve(result);
    } else {
      reject(reason);
    }
  }

  function updateInProgress(update, stage, dbg) {

    $timeout(function() {
      if (update) {
        INPROGRESS.active = true;
        INPROGRESS.progressmsg = update;
      } else {
        INPROGRESS.active = false;
        INPROGRESS.progressmsg = '';
      }
      if (stage !== undefined && (typeof stage === 'number')) {
        INPROGRESS.stage = stage;
      }

      con.debug('progress update ['+ dbg+']: ' + INPROGRESS.stage + ' ' + INPROGRESS.active + ' ' + INPROGRESS.progressmsg);
    }, 0);

  }

  function clrErrorMsg() {
    INPROGRESS.errormessage = '';
  }

  function setErrorMsg(response, stage, dbg) {
    updateInProgress('', stage, dbg);
    if (response) {
      INPROGRESS.errormessage = utilFactory.getErrorMsg(response);
    } else {
      INPROGRESS.errormessage = '';
    }
  }

  function initInProgress(stage, dbg) {
    if (typeof stage === 'string') {
      dbg = stage;
      stage = undefined;
    }
    setErrorMsg(undefined, stage, dbg);
  }

  function checkStage(stage) {
    if (stage === undefined) {
      stage = INPROGRESS.stage;
    }
    return stage;
  }

  function isInProcessStage(stage) {
    stage = checkStage(stage);
    return ((stage >= LOGIN) && (stage < LOGGED_IN));
  }

  function isLoggedIn(stage) {
    return (checkStage(stage) === LOGGED_IN);
  }

  function isProcessStageOrLoggedIn(stage) {
    return (isInProcessStage(stage) || isLoggedIn(stage));
  }

  function nextLoginStage(stage) {
    var next = checkStage(stage) + 1;
    if (!isProcessStageOrLoggedIn(next)) {
      next = undefined;
    }
    return next;
  }



  // Request the user's details
  function requestUserDetails (id, queryProcess, onSuccess, onFailure) {

    con.debug('requestUserDetails:' + id);

    userFactory.get('user', { id: id },
      // success function
      function (response) {
        // response from server contains result
        if (queryProcess()) {
          userFactory.readUserRsp(response, {
            objId: RES.ALLOCATED_CANVASSER, // list to store canvassers in
            flags: (storeFactory.CREATE_INIT | storeFactory.APPLY_FILTER),
            storage: RESOURCE_CONST.STORE_OBJ, // save as a list
            next: function (user) {
              USER.role = user.role;
              USER.person = user.person;

              if (onSuccess) {
                onSuccess(response);
              }
            }
          });
        }
      },
      // error function
      function (response) {
        if (onFailure) {
          onFailure(response);
        }
      }
    );
  }

  function labeller () {
    return LABELS[LABELIDX++ % LABELS.length];
  }


  /**
   * Request the canvasses in which the user has assignments
   * @param {number} id             Id of canvassers to request for
   * @param {function} queryProcess Perdicate function to determine if response is processed
   * @param {function} onSuccess    Function to call on sucessful completion
   * @param {function} onFailure    Functio to call on failure
   */
  //function requestAssignedCanvasses(id, queryProcess, onSuccess, onFailure) {

  //  con.debug('requestAssignedCanvasses: ' + id);

  //  canvassAssignmentFactory.query('canvasses', { canvasser: id },
  //    // success function
  //    function (response) {
  //      // response from server contains result
  //      if (queryProcess()) {
  //        var flags = (storeFactory.CREATE_INIT | storeFactory.APPLY_FILTER);

  //        canvassFactory.readResponse(response, getAssignmentRspOptions(flags, onSuccess));
  //      }
  //    },
  //    // error function
  //    function (response) {
  //      if (onFailure) {
  //        onFailure(response);
  //      }
  //    }
  //  );
  //}

  /**
   * Request the user's canvass assignments
   * @param {string} userId         Id of canvasser to request for
   * @param {string} canvassId      Id of canvass to request for
   * @param {function} queryProcess Perdicate function to determine if response is processed
   * @param {function} onSuccess    Function to call on sucessful completion
   * @param {function} onFailure    Function to call on failure
   */
  function requestAssignment(userId, canvassId, queryProcess, onSuccess, onFailure) {

    var param = {};
    if (userId) {
      param.canvasser = userId;
    }
    if (canvassId) {
      param.canvass = canvassId;
    }

    con.debug('requestAssignment: user ' + userId + ' canvass ' + canvassId);

    canvassAssignmentFactory.query('assignment', param,
      // success function
      function (response) {
        // response from server contains result
        if (queryProcess()) {
          var flags = (storeFactory.CREATE_INIT | storeFactory.APPLY_FILTER),
            toProcess = response;

          /* TODO come up with better approach of handling assignment response
            should only be one response for queries using both user & canvass ids but not handling generically atm */
          if (Array.isArray(response)) {
            toProcess = response[0];
          }

          /* could process the response here but it means the UI appears frozen atm, just return the response */
          //canvassAssignmentFactory.readResponse(toProcess, getAssignmentRspOptions(flags, onSuccess));
          onSuccess(toProcess);
        }
      },
      // error function
      function (response) {
        if (onFailure) {
          onFailure(response);
        }
      }
    );
  }

  /**
   * Request the user's canvass assignments
   * @param {string} userId         Id of canvasser to request for
   * @param {string} canvassId      Id of canvass to request for
   * @param {function} queryProcess Perdicate function to determine if response is processed
   * @param {function} onSuccess    Function to call on sucessful completion
   * @param {function} onFailure    Function to call on failure
   * @param {function} onProcStart  Function to call when processing starts
   */
  function processAssignment(toProcess, queryProcess, onSuccess) {

    con.debug('processAssignment:');

    var flags = (storeFactory.CREATE_INIT | storeFactory.APPLY_FILTER)

    canvassAssignmentFactory.readResponse(toProcess, getAssignmentRspOptions(flags, onSuccess));
  }

  /**
   * Request all the canvasses a canvassers has allocations for
   * @param {number} id             Id of canvassers to request for
   * @param {function} queryProcess Perdicate function to determine if response is processed
   * @param {function} onSuccess    Function to call on sucessful completion
   * @param {function} onFailure    Functio to call on failure
   */
  function requestCanvasses (id, queryProcess, onSuccess, onFailure) {

    con.debug('requestCanvasses: ' + id);

    canvassAssignmentFactory.query('canvasses', { canvasser: id },
      // success function
      function (response) {
        // response from server contains result
        if (queryProcess()) {
          var flags = (storeFactory.CREATE_INIT | storeFactory.APPLY_FILTER);

          canvassFactory.readResponse(response, getCanvassesListRspOptions(flags, onSuccess));
        }
      },
      // error function
      function (response) {
        if (onFailure) {
          onFailure(response);
        }
      }
    );
  }


  function getAssignmentRspOptions (schema, flags, next) {
    var addrOpts = getRspAddressOptions(RES.ALLOCATED_ADDR,
                  CANVASSASSIGN_SCHEMA.SCHEMA.getSchemaLink(CANVASSASSIGN_SCHEMA.IDs.ADDRESSES),
                  storeFactory.COPY_SET),  // make copy of addresses
      canvsrOpts = getRspCanvasserOptions(RES.ALLOCATED_CANVASSER,
                  CANVASSASSIGN_SCHEMA.SCHEMA.getSchemaLink(CANVASSASSIGN_SCHEMA.IDs.CANVASSER),
                  storeFactory.COPY_SET), // make copy of canvasser
      canvassOpts = getCanvassRspOptions(
                  CANVASSASSIGN_SCHEMA.SCHEMA.getSchemaLink(CANVASSASSIGN_SCHEMA.IDs.CANVASS)),
      rspOptions = resourceFactory.getStandardArgsObject(
          undefined,    // no objId as don't need to save the assignments response
          'canvassAssignmentFactory', [
            canvsrOpts,   // storage info for canvassers
            addrOpts,     // storage info for addresses
            canvassOpts   // storage info for canvass
          ], 
          schema, flags, next, {
            linkAddressAndResult: true
          });

    // mark address & result objects for linking
    addrOpts[canvassFactory.ADDR_RES_LINKADDRESS] = true;
    // results are in canvass sub doc

    // mark address & canvasser objects for linking
    rspOptions.linkAddressAndCanvasser = {
      labeller: labeller
    };
    addrOpts[canvassAssignmentFactory.ADDR_CANVSR_LINKADDRESS] = true;
    canvsrOpts[canvassAssignmentFactory.ADDR_CANVSR_LINKCANVASSER] = true;

    applyParentFlags(rspOptions);

    return rspOptions;
  }

  function getCanvassRspOptions(schema, flags, next, customArgs) {
    var rspOptions = resourceFactory.getStandardArgsObject(RES.ACTIVE_CANVASS, 'canvassFactory',
                  schema, flags, next, customArgs),
      addrOpts = getRspAddressOptions(RES.ASSIGNED_ADDR,
                  CANVASSSCHEMA.SCHEMA.getSchemaLink(CANVASSSCHEMA.IDs.ADDRESSES),
                  storeFactory.COPY_SET),  // make copy of addresses
      canvsrOpts = getRspCanvasserOptions(RES.ASSIGNED_CANVASSER,
                  CANVASSSCHEMA.SCHEMA.getSchemaLink(CANVASSSCHEMA.IDs.CANVASSERS),
                  storeFactory.COPY_SET),  // make copy of canvassers
      resltsOpts = getRspResultOptions(RES.CANVASS_RESULT,
                  CANVASSSCHEMA.SCHEMA.getSchemaLink(CANVASSSCHEMA.IDs.RESULTS),
                  storeFactory.COPY_SET),   // make copy of results
      electionOpts = getRspElectionOptions(RES.ACTIVE_ELECTION,
                  CANVASSSCHEMA.SCHEMA.getSchemaLink(CANVASSSCHEMA.IDs.ELECTION)),
      surveyOpts = getSurveyRspOptions(
                  CANVASSSCHEMA.SCHEMA.getSchemaLink(CANVASSSCHEMA.IDs.SURVEY));

    rspOptions.subObj = makeOrAppendArray(rspOptions.subObj, [
      electionOpts, // storage info for election
      surveyOpts,   // storage info for survey
      addrOpts,     // storage info for addresses
      canvsrOpts,   // storage info for canvassers
      resltsOpts    // storage info for results
    ]);

    // mark address & result objects for linking
    angular.extend(rspOptions.customArgs, {
      linkAddressAndResult: true
    });
    addrOpts[canvassFactory.ADDR_RES_LINKADDRESS] = true;
    resltsOpts[canvassFactory.ADDR_RES_LINKRESULT] = true;

    // mark address & canvasser objects for linking
    addrOpts[canvassAssignmentFactory.ADDR_CANVSR_ADDRESSARRAY] = true;
    canvsrOpts[canvassAssignmentFactory.ADDR_CANVSR_CANVASSERARRAY] = true;

    applyParentFlags(rspOptions);
    applyCustom(rspOptions, rspOptions.customArgs);

    return rspOptions;
  }

  function getCanvassesListRspOptions (schema, flags, next, customArgs) {
    var rspOptions = resourceFactory.getStandardArgsObject(RES.CANVASS_LIST, 'canvassFactory',
                            schema, flags, next, customArgs),
      electionOpts = getRspElectionOptions(undefined, // not saving elections separately
                  CANVASSSCHEMA.SCHEMA.getSchemaLink(CANVASSSCHEMA.IDs.ELECTION)),
      // basic survey info, no sub objs
      surveyOpts = resourceFactory.getStandardArgsObject(undefined, // not saving surveys seperately
                  CANVASSSCHEMA.SCHEMA.getSchemaLink(CANVASSSCHEMA.IDs.SURVEY));

    rspOptions.subObj = makeOrAppendArray(rspOptions.subObj, [
      electionOpts, // storage info for election
      surveyOpts   // storage info for survey
      // ignore info for addresses/canvassers/results
    ]);

    // read all except addresses/canvassers/results
    rspOptions.schemaReadIds = [
      CANVASSSCHEMA.IDs.ADDRESSES,
      CANVASSSCHEMA.IDs.CANVASSERS,
      CANVASSSCHEMA.IDs.RESULTS
    ];
    rspOptions.schemaExcludeMode = true;

    applyParentFlags(rspOptions);
    applyCustomToSubObj(rspOptions, {
      processArg: RESOURCE_CONST.PROCESS_READ  // argument only for use during read
    });

    return rspOptions;
  }

  function getRspElectionOptions(objId, schema, flags, next, customArgs) {
    // storage info for elections
    return resourceFactory.getStandardArgsObject(objId, 'electionFactory', schema, flags, next, customArgs);
  }

  function getRspAddressOptions(objId, schema, flags, next, customArgs) {
    // storage info for addresses
    return resourceFactory.getStandardArgsObject(objId, 'addressFactory', schema, flags, next, customArgs);
  }

  function getRspCanvasserOptions(objId, schema, flags, next, customArgs) {
    // storage info for canvassers
    return resourceFactory.getStandardArgsObject(objId, 'userFactory', schema, flags, next, customArgs);
  }

  function getRspResultOptions(objId, schema, flags, next, customArgs) {
    // storage info for results, no need to decode embedded address/canvass/voter subdocs as not required
    var modelProps = CANVASSRES_SCHEMA.SCHEMA.getModelPropList({
        type: SCHEMA_CONST.FIELD_TYPES.OBJECTID,  // get list of properties of type OBJECTID
        id: function (id) {
          return (id !== CANVASSRES_SCHEMA.IDs.ID); // but not the canvass result id
        }
      }),
      subObj = [],
      read,
      prune;
    // create subObj array to just read the ids
    modelProps.forEach(function (mdlProp) {
      read = undefined;
      prune = undefined;
      if (mdlProp.factory) {
        var schema = $injector.get(mdlProp.factory).getSchema();
        if (schema) {
          read = [schema.ids.ID]; // only want id
          prune = [];
          for (var id in schema.ids) {
            if (schema.ids[id] !== schema.ids.ID) {
              prune.push(schema.ids[id]); // prune anything other than id
            }
          }
        }
      }
      subObj.push({
        processArg: RESOURCE_CONST.PROCESS_READ,  // argument only for use during read
        schema: CANVASSRES_SCHEMA.SCHEMA,
        schemaId: mdlProp.id,
        schemaReadIds: read,
        schemaPruneIds: prune
      });
    });
    
    return resourceFactory.getStandardArgsObject(objId, 'canvassResultFactory', subObj, schema, flags, next, customArgs);
  }

  function applyParentFlags(rspOptions) {
    if (rspOptions.subObj) {
      miscUtilFactory.toArray(rspOptions.subObj).forEach(function (obj) {
        obj.flags |= rspOptions.flags;
      });
    }
  }

  function applyCustom(rspOptions, customArgs) {
    if (customArgs) {
      // add custom items
      miscUtilFactory.copyProperties(customArgs, rspOptions);
    }
  }

  function applyCustomToSubObj(rspOptions, customArgs) {
    if (rspOptions.subObj && customArgs) {
      // add custom items
      miscUtilFactory.toArray(rspOptions.subObj).forEach(function (obj) {
        miscUtilFactory.copyProperties(customArgs, obj);
      });
    }
  }

  function makeOrAppendArray(array, toAdd) {
    if (!array) {
      array = [];
    }
    return miscUtilFactory.toArray(array).concat(toAdd);
  }


  function getSurveyRspOptions(schema, flags, next, customArgs) {
    var subObj = resourceFactory.getStandardArgsObject(RES.SURVEY_QUESTIONS,
                  SURVEYSCHEMA.SCHEMA.getSchemaLink(SURVEYSCHEMA.IDs.QUESTIONS),
                  storeFactory.COPY_SET),  // make copy of questions
      rspOptions = resourceFactory.getStandardArgsObject(RES.ACTIVE_SURVEY, 'surveyFactory', [subObj], schema, flags, next, customArgs);

    applyParentFlags(rspOptions);

    return rspOptions;
  }

  function findOption (options, objId) {
    var option,
      i,
      args = resourceFactory.standardiseArgs(options);

    for (i = 0; (i < args.objId.length) && !option; ++i) {
      if (args.objId[i] === objId) {
        option = args;
        option.objId = objId; // just the id we're looking for
        delete option.subObj; // just want the matching obj info
      }
    }
    if (!option && args.subObj) {
      // check sub objs
      for (i = 0; (i < args.subObj.length) && !option; ++i) {
        option = findOption(args.subObj[i], objId);
      }
    }

    return option;
  }




  // Request the user's canvass assignments
  function requestCompletedAssignments(canvassId, canvasserId, queryProcess, onSuccess, onFailure) {

    con.debug('requestCompletedAssignments: canvass ' + canvassId + ' user ' + canvasserId);

    canvassResultFactory.query('result', {
      canvass: canvassId,
      canvasser: canvasserId
    },
      // success function
      function (response) {
        // response from server contains result
        if (queryProcess()) {
          var addrList = addressFactory.getObj(RES.ALLOCATED_ADDR);
          if (addrList) {
            response.forEach(function (result) {
              for (var i = 0; i < addrList.count; ++i) {
                if (addrList.list[i]._id === result.address) {
                  addrList.list[i].canvassed = true;
                  break;
                }
              }
            });
          }
          if (onSuccess) {
            onSuccess(response);
          }
        }
      },
      // error function
      function (response) {
        if (onFailure) {
          onFailure(response);
        }
      }
    );
  }

}


