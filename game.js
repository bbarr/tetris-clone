/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _medium = __webpack_require__(1);

	var _medium2 = _interopRequireDefault(_medium);

	var els = {
	  game: document.getElementById('game'),
	  preview: document.getElementById('preview'),
	  field: document.getElementById('field')
	};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _buffers = __webpack_require__(2);

	var _buffers2 = _interopRequireDefault(_buffers);

	var _transducer_support = __webpack_require__(3);

	var _transducer_support2 = _interopRequireDefault(_transducer_support);

	var _util = __webpack_require__(4);

	var _util2 = _interopRequireDefault(_util);

	var CLOSED = 'medium-closed-state';

	// CORE
	function chan(bufferOrN, xduce) {

	  var buffer = typeof bufferOrN === 'number' ? _buffers2['default'].fixed(bufferOrN) : bufferOrN || _buffers2['default'].base();

	  return {
	    args: arguments,
	    closed: false,
	    takes: [],
	    xduce: _transducer_support2['default'].transform(xduce),
	    buffer: buffer,
	    downstream: [],
	    taps: [],
	    piped: []
	  };
	}

	function take(ch) {

	  var take = createAction();

	  if (ch.closed) {
	    take.resolve(CLOSED);
	    return take.promise;
	  }

	  var put = ch.buffer.shift();

	  if (put) {
	    run(ch, put, take);
	  } else {
	    ch.takes.push(take);
	  }

	  return take.promise;
	}

	function put(ch, v) {

	  var put = createAction({ payload: v });

	  if (ch.closed) {
	    put.resolve(false);
	    return put.promise;
	  }

	  // handle transducer
	  put.payload = _transducer_support2['default'].apply(ch.xduce, put.payload);
	  if (typeof put.payload === 'undefined') {
	    ch.takes.unshift(take); // nm, put it back
	    put.resolve(true);
	    return put.promise;
	  }

	  var take = ch.takes.shift();
	  if (take) {
	    run(ch, put, take);
	  } else {
	    ch.buffer.push(put);
	  }

	  return put.promise;
	}

	function close(ch) {
	  ch.closed = true;
	  ch.downstream.forEach(close);
	  ch.takes.forEach(function (t) {
	    return t.resolve(CLOSED);
	  });
	  var currPut;
	  while (currPut = ch.buffer.shift()) {
	    currPut.resolve(false);
	  }
	}

	// UTILITIES
	function go(afn) {
	  return afn();
	}

	function sleep(ms) {
	  return new Promise(function (res) {
	    return setTimeout(res.bind(null, true), ms);
	  });
	}

	function clone(ch) {
	  return chan.apply(null, ch.args);
	}

	function run(ch, put, take) {
	  take.resolve(put.payload);
	  put.resolve(true);
	}

	function createAction() {
	  var config = arguments[0] === undefined ? {} : arguments[0];

	  var _resolve;

	  return {
	    payload: config.payload,
	    resolve: function resolve(payload) {
	      return _resolve(payload);
	    },
	    promise: new Promise(function (res) {
	      return _resolve = res;
	    })
	  };
	}

	// OPERATIONS
	function pipe(from, to, opts) {
	  from.piped.push([to, opts]);
	  from.downstream.push(to);
	  go(function callee$1$0() {
	    var current;
	    return regeneratorRuntime.async(function callee$1$0$(context$2$0) {
	      while (1) switch (context$2$0.prev = context$2$0.next) {
	        case 0:
	          if (false) {
	            context$2$0.next = 10;
	            break;
	          }

	          context$2$0.next = 3;
	          return regeneratorRuntime.awrap(take(from));

	        case 3:
	          current = context$2$0.sent;

	          if (!(current === CLOSED)) {
	            context$2$0.next = 6;
	            break;
	          }

	          return context$2$0.abrupt('break', 10);

	        case 6:
	          context$2$0.next = 8;
	          return regeneratorRuntime.awrap(put(to, current));

	        case 8:
	          context$2$0.next = 0;
	          break;

	        case 10:
	        case 'end':
	          return context$2$0.stop();
	      }
	    }, null, this);
	  });
	}

	function mult(src) {
	  var ch = clone(src);
	  go(function callee$1$0() {
	    var current, i, result;
	    return regeneratorRuntime.async(function callee$1$0$(context$2$0) {
	      while (1) switch (context$2$0.prev = context$2$0.next) {
	        case 0:
	          if (false) {
	            context$2$0.next = 17;
	            break;
	          }

	          context$2$0.next = 3;
	          return regeneratorRuntime.awrap(take(ch));

	        case 3:
	          current = context$2$0.sent;

	          if (!(current === CLOSED)) {
	            context$2$0.next = 6;
	            break;
	          }

	          return context$2$0.abrupt('break', 17);

	        case 6:
	          i = 0;

	        case 7:
	          if (!(i < ch.taps.length)) {
	            context$2$0.next = 15;
	            break;
	          }

	          context$2$0.next = 10;
	          return regeneratorRuntime.awrap(put(ch.taps[i][0], current));

	        case 10:
	          result = context$2$0.sent;

	          if (result === false) mult.untap(src, ch.taps[i][0]);

	        case 12:
	          i++;
	          context$2$0.next = 7;
	          break;

	        case 15:
	          context$2$0.next = 0;
	          break;

	        case 17:
	        case 'end':
	          return context$2$0.stop();
	      }
	    }, null, this);
	  });
	  return ch;
	}

	mult.tap = function (src, dest, opts) {
	  src.taps.push([dest, opts]);
	  src.downstream.push(dest);
	};

	mult.untap = function (src, dest) {
	  _util2['default'].findAndRemoveChannelWithOpts(src.taps, dest);
	  src.downstream.splice(src.downstream.indexOf(dest), 1);
	};

	// API
	exports['default'] = {
	  CLOSED: CLOSED,
	  go: go,
	  sleep: sleep,
	  close: close,
	  put: put,
	  take: take,
	  buffers: _buffers2['default'],
	  chan: chan,
	  ops: {
	    pipe: pipe,
	    mult: mult
	  }
	};
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	function base() {
	  return {
	    unreleased: [],
	    push: function push(put) {
	      this.unreleased.push(put);
	    },
	    shift: function shift() {
	      return this.unreleased.shift();
	    }
	  };
	}

	function fixed(limit, xduce) {
	  return {
	    unreleased: [],
	    released: [],
	    release: function release(put) {
	      this.released.push(put);
	      put.resolve(true);
	    },
	    push: function push(put) {
	      if (this.released.length === limit) {
	        this.unreleased.push(put);
	      } else {
	        this.release(put);
	      }
	    },
	    shift: function shift() {
	      if (!this.released.length) return;

	      var next = this.released.shift();

	      var waiting = this.unreleased.shift();
	      if (waiting) this.release(waiting);

	      return next;
	    }
	  };
	}

	function dropping(limit) {
	  return {
	    released: [],
	    push: function push(put) {
	      if (this.released.length < limit) {
	        this.released.push(put);
	      }
	      put.resolve(true);
	    },
	    shift: function shift() {
	      return this.released.shift();
	    }
	  };
	}

	function sliding(limit) {
	  return {
	    released: [],
	    push: function push(put) {
	      if (this.released.length === limit) {
	        this.released = this.released.slice(1).concat([put]);
	      } else {
	        this.released.push(put);
	      }
	      put.resolve(true);
	    },
	    shift: function shift() {
	      return this.released.shift();
	    }
	  };
	}

	exports["default"] = { base: base, fixed: fixed, dropping: dropping, sliding: sliding };
	module.exports = exports["default"];

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	function transformer() {
	  return {
	    "@@transducer/init": function transducerInit() {
	      throw new Error("init not available");
	    },
	    "@@transducer/result": function transducerResult(v) {
	      return v;
	    },
	    "@@transducer/step": function transducerStep(arr, input) {
	      arr.push(input);
	      return arr;
	    }
	  };
	}

	exports["default"] = {

	  transformer: transformer,

	  transform: function transform(xduce) {
	    return xduce ? xduce(transformer()) : transformer();
	  },

	  apply: function apply(xduce, val) {
	    return xduce["@@transducer/step"]([], val)[0];
	  }
	};
	module.exports = exports["default"];

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports["default"] = {

	  findAndRemoveChannelWithOpts: function findAndRemoveChannelWithOpts(arr, target) {
	    for (var i = 0; i < arr.length; i++) {
	      if (arr[i][0] === target) {
	        arr.splice(i, 1);
	        break;
	      }
	    }
	  },

	  once: function once(fn) {
	    var called = false;
	    return function () {
	      if (called) return;
	      called = true;
	      fn.apply(null, arguments);
	    };
	  }
	};
	module.exports = exports["default"];

/***/ }
/******/ ]);