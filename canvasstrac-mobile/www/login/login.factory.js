/*jslint node: true */
'use strict';

angular.module('canvassTrac')

  .factory('loginFactory', loginFactory);

/* Manually Identify Dependencies
  https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091
*/

loginFactory.$inject = ['authFactory', 'canvassFactory', 'surveyFactory', 'canvassResultFactory', 'pagerFactory',
  'userFactory', 'addressFactory', 'electionFactory', 'storeFactory',
  'STATES', 'RES', 'USER', 'RESOURCE_CONST'];
function loginFactory(authFactory, canvassFactory, surveyFactory, canvassResultFactory, pagerFactory,
  userFactory, addressFactory, electionFactory, storeFactory,
  STATES, RES, USER, RESOURCE_CONST) {

  // Bindable Members Up Top, https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033
  var factory = {
    setUp: setUp,
    config: config,
    clearData: clearData,
    setFilter: setFilter,
    requestUserDetails: requestUserDetails,
    requestAssignment: requestAssignment,
    requestCompletedAssignments: requestCompletedAssignments
  };

  return factory;

  /* function implementation
    -------------------------- */

  function getSetUpList() {
    return [
      {id: RES.ALLOCATED_CANVASSER, title: 'Canvassers', list: true, factory: userFactory},
      {id: RES.ALLOCATED_ADDR, title: 'Addresses', list: true, factory: addressFactory},
      {id: RES.CANVASS_RESULT, title: 'Canvass Results', list: true, factory: canvassResultFactory},
      {id: RES.ACTIVE_CANVASS, title: '', list: false, factory: canvassFactory},
      {id: RES.ACTIVE_SURVEY, title: '', list: false, factory: surveyFactory},
      {id: RES.ACTIVE_ELECTION, title: '', list: false, factory: electionFactory}
    ];
  }

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

  function config (options) {
    if (!options) {
      options = {};
    }
    getSetUpList().forEach(function (entry) {
      if (entry.list) {
        configList(entry.id, entry.factory, options);
      } else {
        configObj(entry.id, entry.factory, options);
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
      resList = factory.newList(id, options.title, storeFactory.CREATE_INIT);
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
            storage: RESOURCE_CONST.STORE_LIST, // save as a list
            next: function (resList) {
              // saved as list, but only 1 entry
              // update global USER value
              if (resList.count == 1) {
                USER.role = resList.list[0].role;
                USER.person = resList.list[0].person;
              }

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


  // Request the user's canvass assignments
  function requestAssignment (id, queryProcess, onSuccess, onFailure) {

    console.debug('requestAssignment: ' + id);

    var labels = ['label-primary',
      'label-success',
      'label-info',
      'label-warning',
      'label-danger'
      ];

    canvassFactory.getCanvassAllocation().query({ canvasser: id }).$promise.then(
      // success function
      function (response) {
        // response from server contains result
        if (queryProcess()) {
          canvassFactory.readCanvassAllocationRsp(response, {
              addrId: RES.ALLOCATED_ADDR,       // list to store addr in
              userId: RES.ALLOCATED_CANVASSER,  // list to store canvasser in
              flags: (storeFactory.CREATE_INIT | storeFactory.APPLY_FILTER),
              labeller: function (index) {
                return labels[index % labels.length];
              },
              canvassArgs: {
                objId: RES.ACTIVE_CANVASS,  // id of canvass object to save response data to
                addrId: RES.ASSIGNED_ADDR,  // id of list to save addresses assigned to canvass
                userId: RES.ASSIGNED_CANVASSER, // id of list to save canvassers assigned to canvass
                resultsId: RES.CANVASS_RESULT,  // id of list to save canvass results to
                flags: (storeFactory.CREATE_INIT | storeFactory.APPLY_FILTER),
                surveyArgs: {
                  objId: RES.ACTIVE_SURVEY, // id of survey object to save response data to
                  flags: storeFactory.CREATE_INIT
                },
                electionArgs: {
                  objId: RES.ACTIVE_ELECTION, // id of election object to save response data to
                  flags: storeFactory.CREATE_INIT
                }
              }
            },
            onSuccess);
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




  canvassResultFactory.getCanvassResult().save(result,
  function (response) {
    // success response
    $scope.addr.canvassed = true;

    $state.go(STATES.ADDRESSLIST);   // go to addresses screen
  },
  function (response) {
    // error response
  }
);

}


