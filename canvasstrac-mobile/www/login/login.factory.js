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
  .factory('loginFactory', loginFactory);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

loginFactory.$inject = ['$injector', 'authFactory', 'canvassFactory', 'surveyFactory', 'canvassAssignmentFactory', 'canvassResultFactory', 'pagerFactory',
  'userFactory', 'addressFactory', 'electionFactory', 'questionFactory', 'storeFactory', 'resourceFactory', 'miscUtilFactory',
  'STATES', 'RES', 'USER', 'SCHEMA_CONST', 'RESOURCE_CONST', 'CANVASSSCHEMA', 'SURVEYSCHEMA', 'CANVASSRES_SCHEMA', 'CANVASSASSIGN_SCHEMA', 'LABELS', 'LABELIDX'];
function loginFactory($injector, authFactory, canvassFactory, surveyFactory, canvassAssignmentFactory, canvassResultFactory, pagerFactory,
  userFactory, addressFactory, electionFactory, questionFactory, storeFactory, resourceFactory, miscUtilFactory,
  STATES, RES, USER, SCHEMA_CONST, RESOURCE_CONST, CANVASSSCHEMA, SURVEYSCHEMA, CANVASSRES_SCHEMA, CANVASSASSIGN_SCHEMA, LABELS, LABELIDX) {

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  var factory = {
    setUp: setUp,
    config: config,
    clearData: clearData,
    setFilter: setFilter,
    requestUserDetails: requestUserDetails,
    requestCanvasses: requestCanvasses,
    requestAssignment: requestAssignment,
    requestCompletedAssignments: requestCompletedAssignments
  };

  return factory;

  /* function implementation
    -------------------------- */

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
   * Configure objects in a scope
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
  }

  function clearData () {
    getSetUpList().forEach(function (entry) {
      if (entry.list) {
        entry.factory.initList(entry.id);
      } else {
        entry.factory.initObj(entry.id);
      }
    });
  }

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
      filter = storeFactory.newObj(filterId, factory.newFilter, storeFactory.CREATE_INIT);
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


  // Request the user's details
  function requestUserDetails (id, queryProcess, onSuccess, onFailure) {

    console.debug('requestUserDetails:' + id);

    userFactory.getUsers().get({ id: id }).$promise.then(
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
                onSuccess();
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
  function requestAssignedCanvasses(id, queryProcess, onSuccess, onFailure) {

    console.debug('requestAssignedCanvasses: ' + id);

    canvassAssignmentFactory.getAssignmentCanvasses().query({ canvasser: id }).$promise.then(
      // success function
      function (response) {
        // response from server contains result
        if (queryProcess()) {
          var flags = (storeFactory.CREATE_INIT | storeFactory.APPLY_FILTER);

          canvassFactory.readResponse(response, getAssignmentRspOptions(flags, onSuccess));
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
   * @param {function} onFailure    Functio to call on failure
   */
  function requestAssignment (userId, canvassId, queryProcess, onSuccess, onFailure) {

    var param = {};
    if (userId) {
      param.canvasser = userId;
    }
    if (canvassId) {
      param.canvass = canvassId;
    }

    console.debug('requestAssignment: user ' + userId + ' canvass ' + canvassId);

    canvassAssignmentFactory.getCanvassAssignment().query(param).$promise.then(
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

          canvassAssignmentFactory.readResponse(toProcess, getAssignmentRspOptions(flags, onSuccess));
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
   * Request all the canvasses a canvassers has allocations for
   * @param {number} id             Id of canvassers to request for
   * @param {function} queryProcess Perdicate function to determine if response is processed
   * @param {function} onSuccess    Function to call on sucessful completion
   * @param {function} onFailure    Functio to call on failure
   */
  function requestCanvasses (id, queryProcess, onSuccess, onFailure) {

    console.debug('requestCanvasses: ' + id);

    canvassAssignmentFactory.getAssignmentCanvasses().query({ canvasser: id }).$promise.then(
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
    var //args = checkArgs(schema, flags, next),
      addrOpts = getRspAddressOptions(RES.ALLOCATED_ADDR, {
        schema: CANVASSASSIGN_SCHEMA.SCHEMA,
        schemaId: CANVASSASSIGN_SCHEMA.IDs.ADDRESSES,
      }, /*(args.flags |*/ storeFactory.COPY_SET/*)*/),  // make copy of addresses
      canvsrOpts = getRspCanvasserOptions(RES.ALLOCATED_CANVASSER, {
        schema: CANVASSASSIGN_SCHEMA.SCHEMA,
        schemaId: CANVASSASSIGN_SCHEMA.IDs.CANVASSER,
      }, /*(args.flags |*/ storeFactory.COPY_SET/*)*/), // make copy of canvasser
      canvassOpts = getCanvassRspOptions({
        schema: CANVASSASSIGN_SCHEMA.SCHEMA,
        schemaId: CANVASSASSIGN_SCHEMA.IDs.CANVASS
      }),
      rspOptions = resourceFactory.getStandardArgsObject(
          undefined,    // no objId as don't need to save the assignments response
          'canvassAssignmentFactory', [
          canvsrOpts,   // storage info for canvassers
          addrOpts,     // storage info for addresses
          canvassOpts   // storage info for canvass
        ], schema, flags, next);

    // mark address & result objects for linking
    rspOptions.linkAddressAndResult = true;
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

    //return {
    //  // no objId as don't need to save the assignments response
    //  flags: args.flags,
    //  next: args.next,
    //  subObj: [
    //      // storage info for canvasser
    //      canvsrOpts,
    //      // storage info for addresses
    //      addrOpts,
    //      // storage info for canvass
    //      getCanvassRspOptions({
    //        schema: CANVASSASSIGN_SCHEMA.SCHEMA,
    //        schemaId: CANVASSASSIGN_SCHEMA.IDs.CANVASS
    //      }, args.flags)
    //  ],
    //  linkAddressAndResult: true,
    //  linkAddressAndCanvasser: {
    //    labeller: labeller
    //  }
    //};
  }

  function getCanvassRspOptions(schema, flags, next, custom) {
    var args = resourceFactory.checkStandardArgsObjectArgs(schema, flags, next, custom),
      addrOpts = getRspAddressOptions(RES.ASSIGNED_ADDR, {
        schema: CANVASSSCHEMA.SCHEMA,
        schemaId: CANVASSSCHEMA.IDs.ADDRESSES,
      }, (args.flags | storeFactory.COPY_SET)),  // make copy of addresses
      canvsrOpts = getRspCanvasserOptions(RES.ASSIGNED_CANVASSER, {
        schema: CANVASSSCHEMA.SCHEMA,
        schemaId: CANVASSSCHEMA.IDs.CANVASSERS,
      }, (args.flags | storeFactory.COPY_SET)),  // make copy of canvassers
      resltsOpts = getRspResultOptions(RES.CANVASS_RESULT, {
        schema: CANVASSSCHEMA.SCHEMA,
        schemaId: CANVASSSCHEMA.IDs.RESULTS,
      }, (args.flags | storeFactory.COPY_SET)),   // make copy of results
      electionOpts = getRspElectionOptions(RES.ACTIVE_ELECTION, {
        schema: CANVASSSCHEMA.SCHEMA,
        schemaId: CANVASSSCHEMA.IDs.ELECTION,
      }),
      surveyOpts = getSurveyRspOptions({
        schema: CANVASSSCHEMA.SCHEMA,
        schemaId: CANVASSSCHEMA.IDs.SURVEY
      }),
      rspOptions = resourceFactory.getStandardArgsObject(RES.ACTIVE_CANVASS, 'canvassFactory', [
          electionOpts, // storage info for election
          surveyOpts,   // storage info for survey
          addrOpts,     // storage info for addresses
          canvsrOpts,   // storage info for canvassers
          resltsOpts    // storage info for results
      ], schema, flags, next, custom);


      //rspOptions = {
      //  objId: RES.ACTIVE_CANVASS,
      //  factory: args.factory,
      //  schema: args.schema.schema,
      //  schemaId: args.schema.schemaId,
      //  storage: RESOURCE_CONST.STORE_OBJ,
      //  flags: args.flags,
      //  next: args.next,
      //  subObj: [
      //    // storage arguments for specific sub sections of survey info
      //    { // storage info for election
      //      objId: RES.ACTIVE_ELECTION, // id of election object to save response data to
      //      schema: CANVASSSCHEMA.SCHEMA,
      //      schemaId: CANVASSSCHEMA.IDs.ELECTION,
      //      //type/path/storage/factory: can be retrieved using schema & schemaId
      //      flags: args.flags
      //    },
      //    // storage info for survey
      //    getSurveyRspOptions({
      //      schema: CANVASSSCHEMA.SCHEMA,
      //      schemaId: CANVASSSCHEMA.IDs.SURVEY
      //    }, args.flags),
      //    // storage info for addresses
      //    addrOpts,
      //    // storage info for canvassers
      //    canvsrOpts,
      //    // storage info for results
      //    resltsOpts
      //  ],
      //  linkAddressAndResult: true
      //};

    // mark address & result objects for linking
    rspOptions.linkAddressAndResult = true;
    addrOpts[canvassFactory.ADDR_RES_LINKADDRESS] = true;
    resltsOpts[canvassFactory.ADDR_RES_LINKRESULT] = true;

    // mark address & canvasser objects for linking
    addrOpts[canvassAssignmentFactory.ADDR_CANVSR_ADDRESSARRAY] = true;
    canvsrOpts[canvassAssignmentFactory.ADDR_CANVSR_CANVASSERARRAY] = true;

    applyParentFlags(rspOptions);
    applyCustom(rspOptions, args.custom);
    //if (args.custom) {
    //  // add custom items
    //  miscUtilFactory.copyProperties(args.custom, rspOptions);
    //}

    return rspOptions;
  }

  function getCanvassesListRspOptions (schema, flags, next, custom) {
    var args = resourceFactory.checkStandardArgsObjectArgs(schema, flags, next, custom),
      electionOpts = getRspElectionOptions(undefined, { // not saving elections seperately
        schema: CANVASSSCHEMA.SCHEMA,
        schemaId: CANVASSSCHEMA.IDs.ELECTION,
      }),
      // basic survey info, no sub objs
      surveyOpts = resourceFactory.getStandardArgsObject(undefined, { // not saving surveys seperately
        schema: CANVASSSCHEMA.SCHEMA,
        schemaId: CANVASSSCHEMA.IDs.SURVEY
      }, flags, next, custom),
      rspOptions = resourceFactory.getStandardArgsObject(RES.CANVASS_LIST, 'canvassFactory', [
          electionOpts, // storage info for election
          surveyOpts   // storage info for survey
          // ignore info for addresses/canvassers/results
        ], schema, flags, next, custom);

    // read all except addresses/canvassers/results
    rspOptions.schemaReadIds = [
      CANVASSSCHEMA.IDs.ADDRESSES,
      CANVASSSCHEMA.IDs.CANVASSERS,
      CANVASSSCHEMA.IDs.RESULTS
    ];
    rspOptions.schemaExcludeMode = true;

    applyParentFlags(rspOptions);
    applyCustom(rspOptions, args.custom);
    applyCustomToSubObj(rspOptions, {
      processArg: RESOURCE_CONST.PROCESS_READ  // argument only for use during read
    });

    return rspOptions;
  }

  function getRspElectionOptions(objId, schema, flags, next, custom) {
    // storage info for elections
    return resourceFactory.getStandardArgsObject(objId, 'electionFactory', schema, flags, next, custom);
  }

  function getRspAddressOptions(objId, schema, flags, next, custom) {
    // storage info for addresses
    return resourceFactory.getStandardArgsObject(objId, 'addressFactory', schema, flags, next, custom);
  }

  function getRspCanvasserOptions(objId, schema, flags, next, custom) {
    // storage info for canvassers
    return resourceFactory.getStandardArgsObject(objId, 'userFactory', schema, flags, next, custom);
  }

  function getRspResultOptions(objId, schema, flags, next, custom) {
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
    
    return resourceFactory.getStandardArgsObject(objId, 'canvassResultFactory', subObj, schema, flags, next, custom);
  }

  //function getRspOptionsObject(objId, factory, subObj, schema, flags, next, custom) {
  //  var args = checkArgs(factory, subObj, schema, flags, next, custom);
  //  return { // storage info for results
  //    objId: objId,
  //    factory: args.factory,
  //    schema: args.schema.schema,
  //    schemaId: args.schema.schemaId,
  //    //type/path/storage/factory: can be retrieved using schema & schemaId
  //    subObj: args.subObj,
  //    flags: args.flags,
  //    next: args.next,
  //    custom: args.custom
  //  };
  //}

  function applyParentFlags(rspOptions) {
    if (rspOptions.subObj) {
      miscUtilFactory.toArray(rspOptions.subObj).forEach(function (obj) {
        obj.flags |= rspOptions.flags;
      });
    }
  }

  function applyCustom(rspOptions, custom) {
    if (custom) {
      // add custom items
      miscUtilFactory.copyProperties(custom, rspOptions);
    }
  }

  function applyCustomToSubObj(rspOptions, custom) {
    if (rspOptions.subObj && custom) {
      // add custom items
      miscUtilFactory.toArray(rspOptions.subObj).forEach(function (obj) {
        miscUtilFactory.copyProperties(custom, obj);
      });
    }
  }

  //function checkArgs (factory, subObj, schema, flags, next, custom) {
  //  if (!angular.isString(factory)) {
  //    custom = next;
  //    next = flags;
  //    flags = schema;
  //    schema = subObj;
  //    subObj = factory;
  //    factory = undefined;
  //  }
  //  if (!angular.isArray(subObj)) {
  //    custom = next;
  //    next = flags;
  //    flags = schema;
  //    schema = subObj;
  //    subObj = undefined;
  //  }
  //  if (!angular.isObject(schema)) {
  //    custom = next;
  //    next = flags;
  //    flags = schema;
  //    schema = {};
  //  }
  //  if (!angular.isNumber(flags)) {
  //    custom = next;
  //    next = flags;
  //    flags = storeFactory.NOFLAG;
  //  }
  //  if (!angular.isFunction(next)) {
  //    custom = next;
  //    next = undefined;
  //  }
  //  return {
  //    factory: factory, schema: schema, subObj: subObj, 
  //    flags: flags, next: next, custom: custom
  //  };
  //}

  function getSurveyRspOptions(schema, flags, next, custom) {
    var //args = checkArgs('surveyFactory', schema, flags, next, custom);
      subObj = resourceFactory.getStandardArgsObject(RES.SURVEY_QUESTIONS, {
          schema: SURVEYSCHEMA.SCHEMA,
          schemaId: SURVEYSCHEMA.IDs.QUESTIONS,
        }, storeFactory.COPY_SET),  // make copy of questions

    //{
    //  // storage arguments for specific sub sections of survey info
    //  objId: RES.SURVEY_QUESTIONS,
    //  schema: SURVEYSCHEMA.SCHEMA,
    //  schemaId: SURVEYSCHEMA.IDs.QUESTIONS,
    //  //type/path/storage/factory: can be retrieved using schema & schemaId
    //  flags: storeFactory.COPY_SET  // make copy of questions
    //},
      rspOptions = resourceFactory.getStandardArgsObject(RES.ACTIVE_SURVEY, 'surveyFactory', [subObj], schema, flags, next, custom);

    applyParentFlags(rspOptions);

    return rspOptions;
    //return {
    //  // storage info for survey
    //  objId: RES.ACTIVE_SURVEY,
    //  factory: args.factory,
    //  schema: args.schema.schema,
    //  schemaId: args.schema.schemaId,
    //  //type/path/storage: can be retrieved using schema & schemaId
    //  storage: RESOURCE_CONST.STORE_OBJ,
    //  flags: args.flags,
    //  next: args.next,
    //  subObj: {
    //    // storage arguments for specific sub sections of survey info
    //    objId: RES.SURVEY_QUESTIONS,
    //    //factory: 'questionFactory',
    //    schema: SURVEYSCHEMA.SCHEMA,
    //    schemaId: SURVEYSCHEMA.IDs.QUESTIONS,
    //    //type/path/storage/factory: can be retrieved using schema & schemaId
    //    flags: args.flags | storeFactory.COPY_SET  // make copy of questions
    //  }
    //};
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

    console.debug('requestCompletedAssignments: canvass ' + canvassId + ' user ' + canvasserId);

    canvassFactory.getCanvassResult().query({
      canvass: canvassId,
      canvasser: canvasserId
    }).$promise.then(
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


