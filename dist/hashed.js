(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.hashed = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var util = require('./util');

var dec = decodeURIComponent;

var noop = function() {};

var deserializers = {
  string: function(str) {
    if (!str || typeof str !== 'string') {
      throw new Error('Expected string to deserialize: ' + str);
    }
    return dec(str);
  },
  number: function(str) {
    if (!str || typeof str !== 'string') {
      throw new Error('Expected string to deserialize: ' + str);
    }
    var num = Number(dec(str));
    if (isNaN(num)) {
      throw new Error('Expected to deserialize a number: ' + str);
    }
    return num;
  },
  boolean: function(str) {
    if (!str || typeof str !== 'string') {
      throw new Error('Expected string to deserialize: ' + str);
    }
    var bool;
    if (str === '1') {
      bool = true;
    } else if (str === '0') {
      bool = false;
    } else {
      throw new Error('Expected "1" or "0" for boolean: ' + str);
    }
    return bool;
  },
  date: function(str) {
    if (!str || typeof str !== 'string') {
      throw new Error('Expected string to deserialize: ' + str);
    }
    var date = new Date(dec(str));
    if (isNaN(date.getTime())) {
      throw new Error('Expected to deserialize a date: ' + str);
    }
    return date;
  },
  array: function(str) {
    if (!str || typeof str !== 'string') {
      throw new Error('Expected string to deserialize: ' + str);
    }
    var array;
    try {
      array = JSON.parse(dec(str));
    } catch (err) {
      noop();
    }
    if (!array || util.typeOf(array) !== 'array') {
      throw new Error('Expected to deserialize an array: ' + str);
    }
    return array;
  },
  object: function(str) {
    if (!str || typeof str !== 'string') {
      throw new Error('Expected string to deserialize: ' + str);
    }
    var obj;
    try {
      obj = JSON.parse(dec(str));
    } catch (err) {
      noop();
    }
    if (!obj || util.typeOf(obj) !== 'object') {
      throw new Error('Expected to deserialize an object: ' + str);
    }
    return obj;
  }
};


/**
 * Get a deserializer for a value of the given type.
 * @param {string} type Value type.
 * @return {function(string): *} Function that deserializes a string to a value.
 */
exports.get = function(type) {
  if (!(type in deserializers)) {
    throw new Error('Unable to deserialize type: ' + type);
  }
  return deserializers[type];
};

},{"./util":8}],2:[function(require,module,exports){
var util = require('./util');

var serializers = require('./serializers');
var deserializers = require('./deserializers');

/**
 * Create a new field.  A field must have a default value (`init`) and is
 * capable of serializing and deserializing values.
 * @param {Object} config Field configuration.  Must have an init property
 *     with a default value.  The init property can also be a function that
 *     returns the default value.  May have optional `serialize` and
 *     `deserialize` functions.  As a shorthand for providing a config object
 *     with an `init` property, a default value may be provided directly.
 * @constructor
 */
exports.Field = function(config) {
  if (util.typeOf(config) !== 'object') {
    config = {init: config};
  }
  if (!('init' in config)) {
    throw new Error('Missing init');
  }
  var init = config.init;
  if (typeof init === 'function') {
    init = init();
  }
  this.init = init;

  var type = util.typeOf(init);
  this.serialize = config.serialize || serializers.get(type);
  this.deserialize = config.deserialize || deserializers.get(type);
};


},{"./deserializers":1,"./serializers":6,"./util":8}],3:[function(require,module,exports){
var util = require('./util');

/**
 * A lookup of updates to the hash as a result of store updates.  If a
 * hashchange event corresponds to one of these members, the store will not
 * be updated, and the member will be deleted.
 * @type {Object}
 */
var updates = {};

/**
 * Called when the store is updated.
 * @param {Object} values Store values by key.
 * @param {Object} loc The location object whose hash property will be set.
 */
function updateHash(values, loc) {
  var parts = util.zip(values);
  if (parts.length > 0) {
    var path = parts.join('/');
    updates[path] = true;
    loc.hash = '#/' + path;
  }
}

/**
 * Update the store with values from the hash.
 * @param {Object} loc The location with hash values for the store.
 * @param {Store} store The store.
 */
function updateStore(loc, store) {
  var zipped;
  if (loc.hash.length > 2) {
    var path = loc.hash.substring(2);
    if (updates[path]) {
      delete updates[path];
      return;
    }
    zipped = path.split('/');
  } else {
    zipped = [];
  }
  store.update(util.unzip(zipped));
}

/**
 * Generate a URL hash that is a subset of the provided location hash.
 * @param {Object} loc The location object.
 * @param {Array.<string>} keys The list of keys to be plucked from the hash.
 * @return {string} A hash string that includes key/value pairs for just the
 *     provided set of keys.
 */
function pluck(loc, keys) {
  var values = util.unzip(loc.hash.substring(2).split('/'));
  var plucked = {};
  for (var i = 0, ii = keys.length; i < ii; ++i) {
    if (keys[i] in values) {
      plucked[keys[i]] = values[keys[i]];
    }
  }
  return '#/' + util.zip(plucked).join('/');
}

/**
 * Reset the updates cache.
 */
function reset() {
  for (var key in updates) {
    delete updates[key];
  }
}

exports.pluck = pluck;
exports.reset = reset;
exports.updateHash = updateHash;
exports.updateStore = updateStore;

},{"./util":8}],4:[function(require,module,exports){
var Store = require('./store').Store;
var hash = require('./hash');

var store = new Store(function(values) {
  hash.updateHash(values, location);
});

/**
 * Register a new state provider.
 * @param {Object} config Schema config.
 * @param {function(Object)} callback Called when the URL hash changes.
 * @return {function(Object)} Call this function with any updates to the state.
 */
exports.register = function(config, callback) {
  return store.register(config, callback);
};

/**
 * Unregister an existing state provider.
 * @param {function(Object)} callback Callback registered by the provider.
 */
exports.unregister = function(callback) {
  store.unregister(callback);
};

/**
 * Get a URL hash given a set of keys.
 * @param {Array.<string>} keys The keys of interest.
 * @return {string} A URL hash with just the key/value pairs of interest.
 */
exports.pluck = function(keys) {
  return hash.pluck(location, keys);
};

function updateStore() {
  hash.updateStore(location, store);
}

/**
 * Kick things off by updating the store with values from the hash.
 */
setTimeout(updateStore);

/**
 * Update the store any time the hash changes.
 */
addEventListener('hashchange', updateStore);

},{"./hash":3,"./store":7}],5:[function(require,module,exports){
var Field = require('./field').Field;
var util = require('./util');


/**
 * Create a new schema.  A schema is a collection of field definitions.
 * @param {Object} config Keys are field names, values are field configs.
 * @constructor
 */
var Schema = exports.Schema = function(config) {
  config = util.extend({}, config);
  var fields = {};
  var prefix;
  if ('_' in config) {
    prefix = config._;
    delete config._;
  }
  for (var key in config) {
    fields[key] = new Field(config[key]);
  }
  this._prefix = prefix;
  this._fields = fields;
};


/**
 * Get the prefixed version of a key.
 * @param {string} key The key.
 * @return {string} The prefixed key.
 */
Schema.prototype.getPrefixed = function(key) {
  return this._prefix ? (this._prefix + '.' + key) : key;
};


/**
 * Call a callback for each field key.
 * @param {function(string, number)} callback Called with a local field key and
 *     a prefixed key.
 * @param {Object} thisArg This argument for the callback.
 */
Schema.prototype.forEachKey = function(callback, thisArg) {
  var more;
  for (var key in this._fields) {
    more = callback.call(thisArg, key, this.getPrefixed(key));
    if (more === false) {
      return;
    }
  }
};


/**
 * Serialize a value.
 * @param {string} key The key or field name.
 * @param {*} value The value to serialize.
 * @param {Object} values Additional values for providers to use when
 *     serializing.
 * @return {string} The serialized value.
 */
Schema.prototype.serialize = function(key, value, values) {
  if (!(key in this._fields)) {
    throw new Error('Unknown key: ' + key);
  }
  return this._fields[key].serialize(value, values);
};


/**
 * Deserialize a value.
 * @param {string} key The key or field name.
 * @param {string} str The serialized value.
 * @return {*} The deserialized value.
 */
Schema.prototype.deserialize = function(key, str) {
  if (!(key in this._fields)) {
    throw new Error('Unknown key: ' + key);
  }
  return this._fields[key].deserialize(str);
};


/**
 * Get the default value for a particular field.
 * @param {string} key The key or field name.
 * @return {*} The default value.
 */
Schema.prototype.getDefault = function(key) {
  if (!(key in this._fields)) {
    throw new Error('Unknown key: ' + key);
  }
  return this._fields[key].init;
};


/**
 * Determine if one schema conflicts with another.  Two schemas conflict if
 * any of their prefixed keys are the same.
 * @param {Schema} other The other schema.
 * @return {boolean|string} This schema conflicts with the other.  If the two
 *     schemas conflict, the return will be the first conflicting key (with
 *     any prefix).
 */
Schema.prototype.conflicts = function(other) {
  var thisPrefixedKeys = {};
  for (var key in this._fields) {
    thisPrefixedKeys[this.getPrefixed(key)] = true;
  }

  var conflicts = false;
  other.forEachKey(function(_, prefixed) {
    if (prefixed in thisPrefixedKeys) {
      conflicts = prefixed;
    }
    return !conflicts;
  });
  return conflicts;
};

},{"./field":2,"./util":8}],6:[function(require,module,exports){
var util = require('util');

var enc = encodeURIComponent;

var serializers = {
  string: function(str) {
    if (typeof str !== 'string') {
      throw new Error('Expected string to serialize: ' + str);
    }
    return enc(str);
  },
  number: function(num) {
    if (typeof num !== 'number') {
      throw new Error('Expected number to serialize: ' + num);
    }
    return enc(String(num));
  },
  boolean: function(bool) {
    if (typeof bool !== 'boolean') {
      throw new Error('Expected boolean to serialize: ' + bool);
    }
    return bool ? '1' : '0';
  },
  date: function(date) {
    if (!util.isDate(date)) {
      throw new Error('Expected date to serialize: ' + date);
    }
    return enc(date.toISOString());
  },
  array: function(array) {
    if (!util.isArray(array)) {
      throw new Error('Expected array to serialize: ' + array);
    }
    return enc(JSON.stringify(array));
  },
  object: function(obj) {
    return enc(JSON.stringify(obj));
  }
};


/**
 * Get a serializer for a value of the given type.
 * @param {string} type Value type.
 * @return {function(*): string} Function that serializes a value to a string.
 */
exports.get = function(type) {
  if (!(type in serializers)) {
    throw new Error('Unable to serialize type: ' + type);
  }
  return serializers[type];
};

},{"util":12}],7:[function(require,module,exports){
var Schema = require('./schema').Schema;
var util = require('./util');


/**
 * An object backed store of string values.  Allows registering multiple state
 * providers.
 * @param {function(Object)} callback Called with an object of serialized
 *     values whenever a provider updates state.
 * @constructor
 */
var Store = exports.Store = function(callback) {
  this._values = {};
  this._providers = [];
  this._callback = callback;
  this._callbackTimer = null;
};

Store.prototype._scheduleCallback = function() {
  if (this._callbackTimer) {
    clearTimeout(this._callbackTimer);
  }
  this._callbackTimer = setTimeout(this._debouncedCallback.bind(this));
};

Store.prototype._debouncedCallback = function() {
  this._callbackTimer = null;
  this._callback(this._values);
};

Store.prototype.unregister = function(callback) {
  this._providers = this._providers.filter(function(provider) {
    return provider.callback !== callback;
  });
};

/**
 * Register a new state provider.
 * @param {Object} config Schema config.
 * @param {function(Object)} callback Called by the store on state changes.
 * @return {function(Object)} Called by the provider on state changes.
 */
Store.prototype.register = function(config, callback) {
  var provider = {
    schema: new Schema(config),
    state: {},
    callback: callback
  };

  // ensure there are no conflicts with existing providers
  for (var i = 0, ii = this._providers.length; i < ii; ++i) {
    var conflicts = provider.schema.conflicts(this._providers[i].schema);
    if (conflicts) {
      throw new Error('Provider already registered using the same name: ' +
          conflicts);
    }
  }

  this._providers.push(provider);
  setTimeout(function() {
    if (this._providers.indexOf(provider) > -1) {
      this._notifyProvider(provider);
    }
  }.bind(this), 0);

  return function update(state) {
    if (this._providers.indexOf(provider) === -1) {
      throw new Error('Unregistered provider attempting to update state');
    }
    var serialized = {};
    var schema = provider.schema;
    for (var key in state) {
      serialized[schema.getPrefixed(key)] =
          schema.serialize(key, state[key], state);
    }
    util.extend(provider.state, state);
    util.extend(this._values, serialized);
    this._scheduleCallback();
  }.bind(this);
};


/**
 * Notify provider of stored state values where they differ from provider
 * state values.
 * @param {Object} provider Provider to be notified.
 */
Store.prototype._notifyProvider = function(provider) {
  var state = {};
  var changed = false;
  provider.schema.forEachKey(function(key, prefixed) {
    var deserializedValue;
    if (prefixed in this._values) {
      try {
        deserializedValue =
            provider.schema.deserialize(key, this._values[prefixed]);
      } catch (err) {
        deserializedValue = provider.schema.getDefault(key);
      }
    } else {
      deserializedValue = provider.schema.getDefault(key);
    }
    if (key in provider.state) {
      // compare to current provider state
      var serializedValue = provider.schema.serialize(key, deserializedValue,
          provider.state);
      var providerValue = provider.schema.serialize(key, provider.state[key],
          provider.state);
      if (serializedValue !== providerValue) {
        state[key] = deserializedValue;
        provider.state[key] = deserializedValue;
        changed = true;
      }
    } else {
      state[key] = deserializedValue;
      provider.state[key] = deserializedValue;
      changed = true;
    }
  }, this);
  if (changed) {
    provider.callback(state);
  }
};


/**
 * Call the callback for each registered provider.
 * @param {function(this:Store, Object)} callback Callback.
 */
Store.prototype._forEachProvider = function(callback) {
  for (var i = 0, ii = this._providers.length; i < ii; ++i) {
    callback.call(this, this._providers[i]);
  }
};


/**
 * Update the store's values, notifying providers as necessary.
 * @param {Object} values New values.
 */
Store.prototype.update = function(values) {
  this._values = values;
  setTimeout(function() {
    this._forEachProvider(this._notifyProvider);
  }.bind(this), 0);
};

},{"./schema":5,"./util":8}],8:[function(require,module,exports){
var util = require('util');

/**
 * Get the type of a value.
 * @param {*} value The value.
 * @return {string} The type.
 */
exports.typeOf = function typeOf(value) {
  var type = typeof value;
  if (type === 'object') {
    if (value === null) {
      type = 'null';
    } else if (util.isArray(value)) {
      type = 'array';
    } else if (util.isDate(value)) {
      type = 'date';
    } else if (util.isRegExp(value)) {
      type = 'regexp';
    } else if (util.isError(value)) {
      type = 'error';
    }
  }
  return type;
};


/**
 * Copy properties from one object to another.
 * @param {Object} dest The destination object.
 * @param {Object} source The source object.
 * @return {Object} The destination object.
 */
exports.extend = function(dest, source) {
  for (var key in source) {
    dest[key] = source[key];
  }
  return dest;
};


/**
 * Generate an array of alternating name, value from an object's properties.
 * @param {Object} object The object to zip.
 * @return {Array} The array of name, value [, name, value]*.
 */
exports.zip = function(object) {
  var zipped = [];
  var count = 0;
  for (var key in object) {
    zipped[2 * count] = key;
    zipped[2 * count + 1] = object[key];
    ++count;
  }
  return zipped;
};


/**
 * Generate an object from an array of alternating name, value items.
 * @param {Array} array The array of name, value [, name, value]*.
 * @return {Object} The zipped up object.
 */
exports.unzip = function(array) {
  var object = {};
  for (var i = 0, ii = array.length; i < ii; i += 2) {
    object[array[i]] = array[i + 1];
  }
  return object;
};


},{"util":12}],9:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],11:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],12:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":11,"_process":10,"inherits":9}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvZGVzZXJpYWxpemVycy5qcyIsImxpYi9maWVsZC5qcyIsImxpYi9oYXNoLmpzIiwibGliL2luZGV4LmpzIiwibGliL3NjaGVtYS5qcyIsImxpYi9zZXJpYWxpemVycy5qcyIsImxpYi9zdG9yZS5qcyIsImxpYi91dGlsLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIGRlYyA9IGRlY29kZVVSSUNvbXBvbmVudDtcblxudmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9O1xuXG52YXIgZGVzZXJpYWxpemVycyA9IHtcbiAgc3RyaW5nOiBmdW5jdGlvbihzdHIpIHtcbiAgICBpZiAoIXN0ciB8fCB0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBzdHJpbmcgdG8gZGVzZXJpYWxpemU6ICcgKyBzdHIpO1xuICAgIH1cbiAgICByZXR1cm4gZGVjKHN0cik7XG4gIH0sXG4gIG51bWJlcjogZnVuY3Rpb24oc3RyKSB7XG4gICAgaWYgKCFzdHIgfHwgdHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgc3RyaW5nIHRvIGRlc2VyaWFsaXplOiAnICsgc3RyKTtcbiAgICB9XG4gICAgdmFyIG51bSA9IE51bWJlcihkZWMoc3RyKSk7XG4gICAgaWYgKGlzTmFOKG51bSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgdG8gZGVzZXJpYWxpemUgYSBudW1iZXI6ICcgKyBzdHIpO1xuICAgIH1cbiAgICByZXR1cm4gbnVtO1xuICB9LFxuICBib29sZWFuOiBmdW5jdGlvbihzdHIpIHtcbiAgICBpZiAoIXN0ciB8fCB0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBzdHJpbmcgdG8gZGVzZXJpYWxpemU6ICcgKyBzdHIpO1xuICAgIH1cbiAgICB2YXIgYm9vbDtcbiAgICBpZiAoc3RyID09PSAnMScpIHtcbiAgICAgIGJvb2wgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoc3RyID09PSAnMCcpIHtcbiAgICAgIGJvb2wgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBcIjFcIiBvciBcIjBcIiBmb3IgYm9vbGVhbjogJyArIHN0cik7XG4gICAgfVxuICAgIHJldHVybiBib29sO1xuICB9LFxuICBkYXRlOiBmdW5jdGlvbihzdHIpIHtcbiAgICBpZiAoIXN0ciB8fCB0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBzdHJpbmcgdG8gZGVzZXJpYWxpemU6ICcgKyBzdHIpO1xuICAgIH1cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKGRlYyhzdHIpKTtcbiAgICBpZiAoaXNOYU4oZGF0ZS5nZXRUaW1lKCkpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIHRvIGRlc2VyaWFsaXplIGEgZGF0ZTogJyArIHN0cik7XG4gICAgfVxuICAgIHJldHVybiBkYXRlO1xuICB9LFxuICBhcnJheTogZnVuY3Rpb24oc3RyKSB7XG4gICAgaWYgKCFzdHIgfHwgdHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgc3RyaW5nIHRvIGRlc2VyaWFsaXplOiAnICsgc3RyKTtcbiAgICB9XG4gICAgdmFyIGFycmF5O1xuICAgIHRyeSB7XG4gICAgICBhcnJheSA9IEpTT04ucGFyc2UoZGVjKHN0cikpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbm9vcCgpO1xuICAgIH1cbiAgICBpZiAoIWFycmF5IHx8IHV0aWwudHlwZU9mKGFycmF5KSAhPT0gJ2FycmF5Jykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCB0byBkZXNlcmlhbGl6ZSBhbiBhcnJheTogJyArIHN0cik7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbiAgfSxcbiAgb2JqZWN0OiBmdW5jdGlvbihzdHIpIHtcbiAgICBpZiAoIXN0ciB8fCB0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBzdHJpbmcgdG8gZGVzZXJpYWxpemU6ICcgKyBzdHIpO1xuICAgIH1cbiAgICB2YXIgb2JqO1xuICAgIHRyeSB7XG4gICAgICBvYmogPSBKU09OLnBhcnNlKGRlYyhzdHIpKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIG5vb3AoKTtcbiAgICB9XG4gICAgaWYgKCFvYmogfHwgdXRpbC50eXBlT2Yob2JqKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgdG8gZGVzZXJpYWxpemUgYW4gb2JqZWN0OiAnICsgc3RyKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfVxufTtcblxuXG4vKipcbiAqIEdldCBhIGRlc2VyaWFsaXplciBmb3IgYSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gdHlwZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIFZhbHVlIHR5cGUuXG4gKiBAcmV0dXJuIHtmdW5jdGlvbihzdHJpbmcpOiAqfSBGdW5jdGlvbiB0aGF0IGRlc2VyaWFsaXplcyBhIHN0cmluZyB0byBhIHZhbHVlLlxuICovXG5leHBvcnRzLmdldCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCEodHlwZSBpbiBkZXNlcmlhbGl6ZXJzKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGRlc2VyaWFsaXplIHR5cGU6ICcgKyB0eXBlKTtcbiAgfVxuICByZXR1cm4gZGVzZXJpYWxpemVyc1t0eXBlXTtcbn07XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgc2VyaWFsaXplcnMgPSByZXF1aXJlKCcuL3NlcmlhbGl6ZXJzJyk7XG52YXIgZGVzZXJpYWxpemVycyA9IHJlcXVpcmUoJy4vZGVzZXJpYWxpemVycycpO1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBmaWVsZC4gIEEgZmllbGQgbXVzdCBoYXZlIGEgZGVmYXVsdCB2YWx1ZSAoYGluaXRgKSBhbmQgaXNcbiAqIGNhcGFibGUgb2Ygc2VyaWFsaXppbmcgYW5kIGRlc2VyaWFsaXppbmcgdmFsdWVzLlxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyBGaWVsZCBjb25maWd1cmF0aW9uLiAgTXVzdCBoYXZlIGFuIGluaXQgcHJvcGVydHlcbiAqICAgICB3aXRoIGEgZGVmYXVsdCB2YWx1ZS4gIFRoZSBpbml0IHByb3BlcnR5IGNhbiBhbHNvIGJlIGEgZnVuY3Rpb24gdGhhdFxuICogICAgIHJldHVybnMgdGhlIGRlZmF1bHQgdmFsdWUuICBNYXkgaGF2ZSBvcHRpb25hbCBgc2VyaWFsaXplYCBhbmRcbiAqICAgICBgZGVzZXJpYWxpemVgIGZ1bmN0aW9ucy4gIEFzIGEgc2hvcnRoYW5kIGZvciBwcm92aWRpbmcgYSBjb25maWcgb2JqZWN0XG4gKiAgICAgd2l0aCBhbiBgaW5pdGAgcHJvcGVydHksIGEgZGVmYXVsdCB2YWx1ZSBtYXkgYmUgcHJvdmlkZWQgZGlyZWN0bHkuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZXhwb3J0cy5GaWVsZCA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICBpZiAodXRpbC50eXBlT2YoY29uZmlnKSAhPT0gJ29iamVjdCcpIHtcbiAgICBjb25maWcgPSB7aW5pdDogY29uZmlnfTtcbiAgfVxuICBpZiAoISgnaW5pdCcgaW4gY29uZmlnKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBpbml0Jyk7XG4gIH1cbiAgdmFyIGluaXQgPSBjb25maWcuaW5pdDtcbiAgaWYgKHR5cGVvZiBpbml0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaW5pdCA9IGluaXQoKTtcbiAgfVxuICB0aGlzLmluaXQgPSBpbml0O1xuXG4gIHZhciB0eXBlID0gdXRpbC50eXBlT2YoaW5pdCk7XG4gIHRoaXMuc2VyaWFsaXplID0gY29uZmlnLnNlcmlhbGl6ZSB8fCBzZXJpYWxpemVycy5nZXQodHlwZSk7XG4gIHRoaXMuZGVzZXJpYWxpemUgPSBjb25maWcuZGVzZXJpYWxpemUgfHwgZGVzZXJpYWxpemVycy5nZXQodHlwZSk7XG59O1xuXG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vKipcbiAqIEEgbG9va3VwIG9mIHVwZGF0ZXMgdG8gdGhlIGhhc2ggYXMgYSByZXN1bHQgb2Ygc3RvcmUgdXBkYXRlcy4gIElmIGFcbiAqIGhhc2hjaGFuZ2UgZXZlbnQgY29ycmVzcG9uZHMgdG8gb25lIG9mIHRoZXNlIG1lbWJlcnMsIHRoZSBzdG9yZSB3aWxsIG5vdFxuICogYmUgdXBkYXRlZCwgYW5kIHRoZSBtZW1iZXIgd2lsbCBiZSBkZWxldGVkLlxuICogQHR5cGUge09iamVjdH1cbiAqL1xudmFyIHVwZGF0ZXMgPSB7fTtcblxuLyoqXG4gKiBDYWxsZWQgd2hlbiB0aGUgc3RvcmUgaXMgdXBkYXRlZC5cbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXMgU3RvcmUgdmFsdWVzIGJ5IGtleS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBsb2MgVGhlIGxvY2F0aW9uIG9iamVjdCB3aG9zZSBoYXNoIHByb3BlcnR5IHdpbGwgYmUgc2V0LlxuICovXG5mdW5jdGlvbiB1cGRhdGVIYXNoKHZhbHVlcywgbG9jKSB7XG4gIHZhciBwYXJ0cyA9IHV0aWwuemlwKHZhbHVlcyk7XG4gIGlmIChwYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgdmFyIHBhdGggPSBwYXJ0cy5qb2luKCcvJyk7XG4gICAgdXBkYXRlc1twYXRoXSA9IHRydWU7XG4gICAgbG9jLmhhc2ggPSAnIy8nICsgcGF0aDtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSB0aGUgc3RvcmUgd2l0aCB2YWx1ZXMgZnJvbSB0aGUgaGFzaC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBsb2MgVGhlIGxvY2F0aW9uIHdpdGggaGFzaCB2YWx1ZXMgZm9yIHRoZSBzdG9yZS5cbiAqIEBwYXJhbSB7U3RvcmV9IHN0b3JlIFRoZSBzdG9yZS5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlU3RvcmUobG9jLCBzdG9yZSkge1xuICB2YXIgemlwcGVkO1xuICBpZiAobG9jLmhhc2gubGVuZ3RoID4gMikge1xuICAgIHZhciBwYXRoID0gbG9jLmhhc2guc3Vic3RyaW5nKDIpO1xuICAgIGlmICh1cGRhdGVzW3BhdGhdKSB7XG4gICAgICBkZWxldGUgdXBkYXRlc1twYXRoXTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgemlwcGVkID0gcGF0aC5zcGxpdCgnLycpO1xuICB9IGVsc2Uge1xuICAgIHppcHBlZCA9IFtdO1xuICB9XG4gIHN0b3JlLnVwZGF0ZSh1dGlsLnVuemlwKHppcHBlZCkpO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgVVJMIGhhc2ggdGhhdCBpcyBhIHN1YnNldCBvZiB0aGUgcHJvdmlkZWQgbG9jYXRpb24gaGFzaC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBsb2MgVGhlIGxvY2F0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGtleXMgVGhlIGxpc3Qgb2Yga2V5cyB0byBiZSBwbHVja2VkIGZyb20gdGhlIGhhc2guXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEEgaGFzaCBzdHJpbmcgdGhhdCBpbmNsdWRlcyBrZXkvdmFsdWUgcGFpcnMgZm9yIGp1c3QgdGhlXG4gKiAgICAgcHJvdmlkZWQgc2V0IG9mIGtleXMuXG4gKi9cbmZ1bmN0aW9uIHBsdWNrKGxvYywga2V5cykge1xuICB2YXIgdmFsdWVzID0gdXRpbC51bnppcChsb2MuaGFzaC5zdWJzdHJpbmcoMikuc3BsaXQoJy8nKSk7XG4gIHZhciBwbHVja2VkID0ge307XG4gIGZvciAodmFyIGkgPSAwLCBpaSA9IGtleXMubGVuZ3RoOyBpIDwgaWk7ICsraSkge1xuICAgIGlmIChrZXlzW2ldIGluIHZhbHVlcykge1xuICAgICAgcGx1Y2tlZFtrZXlzW2ldXSA9IHZhbHVlc1trZXlzW2ldXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICcjLycgKyB1dGlsLnppcChwbHVja2VkKS5qb2luKCcvJyk7XG59XG5cbi8qKlxuICogUmVzZXQgdGhlIHVwZGF0ZXMgY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIHJlc2V0KCkge1xuICBmb3IgKHZhciBrZXkgaW4gdXBkYXRlcykge1xuICAgIGRlbGV0ZSB1cGRhdGVzW2tleV07XG4gIH1cbn1cblxuZXhwb3J0cy5wbHVjayA9IHBsdWNrO1xuZXhwb3J0cy5yZXNldCA9IHJlc2V0O1xuZXhwb3J0cy51cGRhdGVIYXNoID0gdXBkYXRlSGFzaDtcbmV4cG9ydHMudXBkYXRlU3RvcmUgPSB1cGRhdGVTdG9yZTtcbiIsInZhciBTdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmUnKS5TdG9yZTtcbnZhciBoYXNoID0gcmVxdWlyZSgnLi9oYXNoJyk7XG5cbnZhciBzdG9yZSA9IG5ldyBTdG9yZShmdW5jdGlvbih2YWx1ZXMpIHtcbiAgaGFzaC51cGRhdGVIYXNoKHZhbHVlcywgbG9jYXRpb24pO1xufSk7XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgc3RhdGUgcHJvdmlkZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gY29uZmlnIFNjaGVtYSBjb25maWcuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCl9IGNhbGxiYWNrIENhbGxlZCB3aGVuIHRoZSBVUkwgaGFzaCBjaGFuZ2VzLlxuICogQHJldHVybiB7ZnVuY3Rpb24oT2JqZWN0KX0gQ2FsbCB0aGlzIGZ1bmN0aW9uIHdpdGggYW55IHVwZGF0ZXMgdG8gdGhlIHN0YXRlLlxuICovXG5leHBvcnRzLnJlZ2lzdGVyID0gZnVuY3Rpb24oY29uZmlnLCBjYWxsYmFjaykge1xuICByZXR1cm4gc3RvcmUucmVnaXN0ZXIoY29uZmlnLCBjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIFVucmVnaXN0ZXIgYW4gZXhpc3Rpbmcgc3RhdGUgcHJvdmlkZXIuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCl9IGNhbGxiYWNrIENhbGxiYWNrIHJlZ2lzdGVyZWQgYnkgdGhlIHByb3ZpZGVyLlxuICovXG5leHBvcnRzLnVucmVnaXN0ZXIgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICBzdG9yZS51bnJlZ2lzdGVyKGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogR2V0IGEgVVJMIGhhc2ggZ2l2ZW4gYSBzZXQgb2Yga2V5cy5cbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGtleXMgVGhlIGtleXMgb2YgaW50ZXJlc3QuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEEgVVJMIGhhc2ggd2l0aCBqdXN0IHRoZSBrZXkvdmFsdWUgcGFpcnMgb2YgaW50ZXJlc3QuXG4gKi9cbmV4cG9ydHMucGx1Y2sgPSBmdW5jdGlvbihrZXlzKSB7XG4gIHJldHVybiBoYXNoLnBsdWNrKGxvY2F0aW9uLCBrZXlzKTtcbn07XG5cbmZ1bmN0aW9uIHVwZGF0ZVN0b3JlKCkge1xuICBoYXNoLnVwZGF0ZVN0b3JlKGxvY2F0aW9uLCBzdG9yZSk7XG59XG5cbi8qKlxuICogS2ljayB0aGluZ3Mgb2ZmIGJ5IHVwZGF0aW5nIHRoZSBzdG9yZSB3aXRoIHZhbHVlcyBmcm9tIHRoZSBoYXNoLlxuICovXG5zZXRUaW1lb3V0KHVwZGF0ZVN0b3JlKTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIHN0b3JlIGFueSB0aW1lIHRoZSBoYXNoIGNoYW5nZXMuXG4gKi9cbmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCB1cGRhdGVTdG9yZSk7XG4iLCJ2YXIgRmllbGQgPSByZXF1aXJlKCcuL2ZpZWxkJykuRmllbGQ7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IHNjaGVtYS4gIEEgc2NoZW1hIGlzIGEgY29sbGVjdGlvbiBvZiBmaWVsZCBkZWZpbml0aW9ucy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgS2V5cyBhcmUgZmllbGQgbmFtZXMsIHZhbHVlcyBhcmUgZmllbGQgY29uZmlncy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgU2NoZW1hID0gZXhwb3J0cy5TY2hlbWEgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgY29uZmlnID0gdXRpbC5leHRlbmQoe30sIGNvbmZpZyk7XG4gIHZhciBmaWVsZHMgPSB7fTtcbiAgdmFyIHByZWZpeDtcbiAgaWYgKCdfJyBpbiBjb25maWcpIHtcbiAgICBwcmVmaXggPSBjb25maWcuXztcbiAgICBkZWxldGUgY29uZmlnLl87XG4gIH1cbiAgZm9yICh2YXIga2V5IGluIGNvbmZpZykge1xuICAgIGZpZWxkc1trZXldID0gbmV3IEZpZWxkKGNvbmZpZ1trZXldKTtcbiAgfVxuICB0aGlzLl9wcmVmaXggPSBwcmVmaXg7XG4gIHRoaXMuX2ZpZWxkcyA9IGZpZWxkcztcbn07XG5cblxuLyoqXG4gKiBHZXQgdGhlIHByZWZpeGVkIHZlcnNpb24gb2YgYSBrZXkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBwcmVmaXhlZCBrZXkuXG4gKi9cblNjaGVtYS5wcm90b3R5cGUuZ2V0UHJlZml4ZWQgPSBmdW5jdGlvbihrZXkpIHtcbiAgcmV0dXJuIHRoaXMuX3ByZWZpeCA/ICh0aGlzLl9wcmVmaXggKyAnLicgKyBrZXkpIDoga2V5O1xufTtcblxuXG4vKipcbiAqIENhbGwgYSBjYWxsYmFjayBmb3IgZWFjaCBmaWVsZCBrZXkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgbnVtYmVyKX0gY2FsbGJhY2sgQ2FsbGVkIHdpdGggYSBsb2NhbCBmaWVsZCBrZXkgYW5kXG4gKiAgICAgYSBwcmVmaXhlZCBrZXkuXG4gKiBAcGFyYW0ge09iamVjdH0gdGhpc0FyZyBUaGlzIGFyZ3VtZW50IGZvciB0aGUgY2FsbGJhY2suXG4gKi9cblNjaGVtYS5wcm90b3R5cGUuZm9yRWFjaEtleSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gIHZhciBtb3JlO1xuICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fZmllbGRzKSB7XG4gICAgbW9yZSA9IGNhbGxiYWNrLmNhbGwodGhpc0FyZywga2V5LCB0aGlzLmdldFByZWZpeGVkKGtleSkpO1xuICAgIGlmIChtb3JlID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxufTtcblxuXG4vKipcbiAqIFNlcmlhbGl6ZSBhIHZhbHVlLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9yIGZpZWxkIG5hbWUuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXJpYWxpemUuXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzIEFkZGl0aW9uYWwgdmFsdWVzIGZvciBwcm92aWRlcnMgdG8gdXNlIHdoZW5cbiAqICAgICBzZXJpYWxpemluZy5cbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIHNlcmlhbGl6ZWQgdmFsdWUuXG4gKi9cblNjaGVtYS5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSwgdmFsdWVzKSB7XG4gIGlmICghKGtleSBpbiB0aGlzLl9maWVsZHMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGtleTogJyArIGtleSk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2ZpZWxkc1trZXldLnNlcmlhbGl6ZSh2YWx1ZSwgdmFsdWVzKTtcbn07XG5cblxuLyoqXG4gKiBEZXNlcmlhbGl6ZSBhIHZhbHVlLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9yIGZpZWxkIG5hbWUuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyIFRoZSBzZXJpYWxpemVkIHZhbHVlLlxuICogQHJldHVybiB7Kn0gVGhlIGRlc2VyaWFsaXplZCB2YWx1ZS5cbiAqL1xuU2NoZW1hLnByb3RvdHlwZS5kZXNlcmlhbGl6ZSA9IGZ1bmN0aW9uKGtleSwgc3RyKSB7XG4gIGlmICghKGtleSBpbiB0aGlzLl9maWVsZHMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGtleTogJyArIGtleSk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2ZpZWxkc1trZXldLmRlc2VyaWFsaXplKHN0cik7XG59O1xuXG5cbi8qKlxuICogR2V0IHRoZSBkZWZhdWx0IHZhbHVlIGZvciBhIHBhcnRpY3VsYXIgZmllbGQuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb3IgZmllbGQgbmFtZS5cbiAqIEByZXR1cm4geyp9IFRoZSBkZWZhdWx0IHZhbHVlLlxuICovXG5TY2hlbWEucHJvdG90eXBlLmdldERlZmF1bHQgPSBmdW5jdGlvbihrZXkpIHtcbiAgaWYgKCEoa2V5IGluIHRoaXMuX2ZpZWxkcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24ga2V5OiAnICsga2V5KTtcbiAgfVxuICByZXR1cm4gdGhpcy5fZmllbGRzW2tleV0uaW5pdDtcbn07XG5cblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgb25lIHNjaGVtYSBjb25mbGljdHMgd2l0aCBhbm90aGVyLiAgVHdvIHNjaGVtYXMgY29uZmxpY3QgaWZcbiAqIGFueSBvZiB0aGVpciBwcmVmaXhlZCBrZXlzIGFyZSB0aGUgc2FtZS5cbiAqIEBwYXJhbSB7U2NoZW1hfSBvdGhlciBUaGUgb3RoZXIgc2NoZW1hLlxuICogQHJldHVybiB7Ym9vbGVhbnxzdHJpbmd9IFRoaXMgc2NoZW1hIGNvbmZsaWN0cyB3aXRoIHRoZSBvdGhlci4gIElmIHRoZSB0d29cbiAqICAgICBzY2hlbWFzIGNvbmZsaWN0LCB0aGUgcmV0dXJuIHdpbGwgYmUgdGhlIGZpcnN0IGNvbmZsaWN0aW5nIGtleSAod2l0aFxuICogICAgIGFueSBwcmVmaXgpLlxuICovXG5TY2hlbWEucHJvdG90eXBlLmNvbmZsaWN0cyA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gIHZhciB0aGlzUHJlZml4ZWRLZXlzID0ge307XG4gIGZvciAodmFyIGtleSBpbiB0aGlzLl9maWVsZHMpIHtcbiAgICB0aGlzUHJlZml4ZWRLZXlzW3RoaXMuZ2V0UHJlZml4ZWQoa2V5KV0gPSB0cnVlO1xuICB9XG5cbiAgdmFyIGNvbmZsaWN0cyA9IGZhbHNlO1xuICBvdGhlci5mb3JFYWNoS2V5KGZ1bmN0aW9uKF8sIHByZWZpeGVkKSB7XG4gICAgaWYgKHByZWZpeGVkIGluIHRoaXNQcmVmaXhlZEtleXMpIHtcbiAgICAgIGNvbmZsaWN0cyA9IHByZWZpeGVkO1xuICAgIH1cbiAgICByZXR1cm4gIWNvbmZsaWN0cztcbiAgfSk7XG4gIHJldHVybiBjb25mbGljdHM7XG59O1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbnZhciBlbmMgPSBlbmNvZGVVUklDb21wb25lbnQ7XG5cbnZhciBzZXJpYWxpemVycyA9IHtcbiAgc3RyaW5nOiBmdW5jdGlvbihzdHIpIHtcbiAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgc3RyaW5nIHRvIHNlcmlhbGl6ZTogJyArIHN0cik7XG4gICAgfVxuICAgIHJldHVybiBlbmMoc3RyKTtcbiAgfSxcbiAgbnVtYmVyOiBmdW5jdGlvbihudW0pIHtcbiAgICBpZiAodHlwZW9mIG51bSAhPT0gJ251bWJlcicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgbnVtYmVyIHRvIHNlcmlhbGl6ZTogJyArIG51bSk7XG4gICAgfVxuICAgIHJldHVybiBlbmMoU3RyaW5nKG51bSkpO1xuICB9LFxuICBib29sZWFuOiBmdW5jdGlvbihib29sKSB7XG4gICAgaWYgKHR5cGVvZiBib29sICE9PSAnYm9vbGVhbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgYm9vbGVhbiB0byBzZXJpYWxpemU6ICcgKyBib29sKTtcbiAgICB9XG4gICAgcmV0dXJuIGJvb2wgPyAnMScgOiAnMCc7XG4gIH0sXG4gIGRhdGU6IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICBpZiAoIXV0aWwuaXNEYXRlKGRhdGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIGRhdGUgdG8gc2VyaWFsaXplOiAnICsgZGF0ZSk7XG4gICAgfVxuICAgIHJldHVybiBlbmMoZGF0ZS50b0lTT1N0cmluZygpKTtcbiAgfSxcbiAgYXJyYXk6IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgaWYgKCF1dGlsLmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIGFycmF5IHRvIHNlcmlhbGl6ZTogJyArIGFycmF5KTtcbiAgICB9XG4gICAgcmV0dXJuIGVuYyhKU09OLnN0cmluZ2lmeShhcnJheSkpO1xuICB9LFxuICBvYmplY3Q6IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBlbmMoSlNPTi5zdHJpbmdpZnkob2JqKSk7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBHZXQgYSBzZXJpYWxpemVyIGZvciBhIHZhbHVlIG9mIHRoZSBnaXZlbiB0eXBlLlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgVmFsdWUgdHlwZS5cbiAqIEByZXR1cm4ge2Z1bmN0aW9uKCopOiBzdHJpbmd9IEZ1bmN0aW9uIHRoYXQgc2VyaWFsaXplcyBhIHZhbHVlIHRvIGEgc3RyaW5nLlxuICovXG5leHBvcnRzLmdldCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCEodHlwZSBpbiBzZXJpYWxpemVycykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBzZXJpYWxpemUgdHlwZTogJyArIHR5cGUpO1xuICB9XG4gIHJldHVybiBzZXJpYWxpemVyc1t0eXBlXTtcbn07XG4iLCJ2YXIgU2NoZW1hID0gcmVxdWlyZSgnLi9zY2hlbWEnKS5TY2hlbWE7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5cbi8qKlxuICogQW4gb2JqZWN0IGJhY2tlZCBzdG9yZSBvZiBzdHJpbmcgdmFsdWVzLiAgQWxsb3dzIHJlZ2lzdGVyaW5nIG11bHRpcGxlIHN0YXRlXG4gKiBwcm92aWRlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCl9IGNhbGxiYWNrIENhbGxlZCB3aXRoIGFuIG9iamVjdCBvZiBzZXJpYWxpemVkXG4gKiAgICAgdmFsdWVzIHdoZW5ldmVyIGEgcHJvdmlkZXIgdXBkYXRlcyBzdGF0ZS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgU3RvcmUgPSBleHBvcnRzLlN0b3JlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdGhpcy5fdmFsdWVzID0ge307XG4gIHRoaXMuX3Byb3ZpZGVycyA9IFtdO1xuICB0aGlzLl9jYWxsYmFjayA9IGNhbGxiYWNrO1xuICB0aGlzLl9jYWxsYmFja1RpbWVyID0gbnVsbDtcbn07XG5cblN0b3JlLnByb3RvdHlwZS5fc2NoZWR1bGVDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5fY2FsbGJhY2tUaW1lcikge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9jYWxsYmFja1RpbWVyKTtcbiAgfVxuICB0aGlzLl9jYWxsYmFja1RpbWVyID0gc2V0VGltZW91dCh0aGlzLl9kZWJvdW5jZWRDYWxsYmFjay5iaW5kKHRoaXMpKTtcbn07XG5cblN0b3JlLnByb3RvdHlwZS5fZGVib3VuY2VkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY2FsbGJhY2tUaW1lciA9IG51bGw7XG4gIHRoaXMuX2NhbGxiYWNrKHRoaXMuX3ZhbHVlcyk7XG59O1xuXG5TdG9yZS5wcm90b3R5cGUudW5yZWdpc3RlciA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHRoaXMuX3Byb3ZpZGVycyA9IHRoaXMuX3Byb3ZpZGVycy5maWx0ZXIoZnVuY3Rpb24ocHJvdmlkZXIpIHtcbiAgICByZXR1cm4gcHJvdmlkZXIuY2FsbGJhY2sgIT09IGNhbGxiYWNrO1xuICB9KTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgc3RhdGUgcHJvdmlkZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gY29uZmlnIFNjaGVtYSBjb25maWcuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKE9iamVjdCl9IGNhbGxiYWNrIENhbGxlZCBieSB0aGUgc3RvcmUgb24gc3RhdGUgY2hhbmdlcy5cbiAqIEByZXR1cm4ge2Z1bmN0aW9uKE9iamVjdCl9IENhbGxlZCBieSB0aGUgcHJvdmlkZXIgb24gc3RhdGUgY2hhbmdlcy5cbiAqL1xuU3RvcmUucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24oY29uZmlnLCBjYWxsYmFjaykge1xuICB2YXIgcHJvdmlkZXIgPSB7XG4gICAgc2NoZW1hOiBuZXcgU2NoZW1hKGNvbmZpZyksXG4gICAgc3RhdGU6IHt9LFxuICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICB9O1xuXG4gIC8vIGVuc3VyZSB0aGVyZSBhcmUgbm8gY29uZmxpY3RzIHdpdGggZXhpc3RpbmcgcHJvdmlkZXJzXG4gIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMuX3Byb3ZpZGVycy5sZW5ndGg7IGkgPCBpaTsgKytpKSB7XG4gICAgdmFyIGNvbmZsaWN0cyA9IHByb3ZpZGVyLnNjaGVtYS5jb25mbGljdHModGhpcy5fcHJvdmlkZXJzW2ldLnNjaGVtYSk7XG4gICAgaWYgKGNvbmZsaWN0cykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcm92aWRlciBhbHJlYWR5IHJlZ2lzdGVyZWQgdXNpbmcgdGhlIHNhbWUgbmFtZTogJyArXG4gICAgICAgICAgY29uZmxpY3RzKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLl9wcm92aWRlcnMucHVzaChwcm92aWRlcik7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX3Byb3ZpZGVycy5pbmRleE9mKHByb3ZpZGVyKSA+IC0xKSB7XG4gICAgICB0aGlzLl9ub3RpZnlQcm92aWRlcihwcm92aWRlcik7XG4gICAgfVxuICB9LmJpbmQodGhpcyksIDApO1xuXG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUoc3RhdGUpIHtcbiAgICBpZiAodGhpcy5fcHJvdmlkZXJzLmluZGV4T2YocHJvdmlkZXIpID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnJlZ2lzdGVyZWQgcHJvdmlkZXIgYXR0ZW1wdGluZyB0byB1cGRhdGUgc3RhdGUnKTtcbiAgICB9XG4gICAgdmFyIHNlcmlhbGl6ZWQgPSB7fTtcbiAgICB2YXIgc2NoZW1hID0gcHJvdmlkZXIuc2NoZW1hO1xuICAgIGZvciAodmFyIGtleSBpbiBzdGF0ZSkge1xuICAgICAgc2VyaWFsaXplZFtzY2hlbWEuZ2V0UHJlZml4ZWQoa2V5KV0gPVxuICAgICAgICAgIHNjaGVtYS5zZXJpYWxpemUoa2V5LCBzdGF0ZVtrZXldLCBzdGF0ZSk7XG4gICAgfVxuICAgIHV0aWwuZXh0ZW5kKHByb3ZpZGVyLnN0YXRlLCBzdGF0ZSk7XG4gICAgdXRpbC5leHRlbmQodGhpcy5fdmFsdWVzLCBzZXJpYWxpemVkKTtcbiAgICB0aGlzLl9zY2hlZHVsZUNhbGxiYWNrKCk7XG4gIH0uYmluZCh0aGlzKTtcbn07XG5cblxuLyoqXG4gKiBOb3RpZnkgcHJvdmlkZXIgb2Ygc3RvcmVkIHN0YXRlIHZhbHVlcyB3aGVyZSB0aGV5IGRpZmZlciBmcm9tIHByb3ZpZGVyXG4gKiBzdGF0ZSB2YWx1ZXMuXG4gKiBAcGFyYW0ge09iamVjdH0gcHJvdmlkZXIgUHJvdmlkZXIgdG8gYmUgbm90aWZpZWQuXG4gKi9cblN0b3JlLnByb3RvdHlwZS5fbm90aWZ5UHJvdmlkZXIgPSBmdW5jdGlvbihwcm92aWRlcikge1xuICB2YXIgc3RhdGUgPSB7fTtcbiAgdmFyIGNoYW5nZWQgPSBmYWxzZTtcbiAgcHJvdmlkZXIuc2NoZW1hLmZvckVhY2hLZXkoZnVuY3Rpb24oa2V5LCBwcmVmaXhlZCkge1xuICAgIHZhciBkZXNlcmlhbGl6ZWRWYWx1ZTtcbiAgICBpZiAocHJlZml4ZWQgaW4gdGhpcy5fdmFsdWVzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBkZXNlcmlhbGl6ZWRWYWx1ZSA9XG4gICAgICAgICAgICBwcm92aWRlci5zY2hlbWEuZGVzZXJpYWxpemUoa2V5LCB0aGlzLl92YWx1ZXNbcHJlZml4ZWRdKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBkZXNlcmlhbGl6ZWRWYWx1ZSA9IHByb3ZpZGVyLnNjaGVtYS5nZXREZWZhdWx0KGtleSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlc2VyaWFsaXplZFZhbHVlID0gcHJvdmlkZXIuc2NoZW1hLmdldERlZmF1bHQoa2V5KTtcbiAgICB9XG4gICAgaWYgKGtleSBpbiBwcm92aWRlci5zdGF0ZSkge1xuICAgICAgLy8gY29tcGFyZSB0byBjdXJyZW50IHByb3ZpZGVyIHN0YXRlXG4gICAgICB2YXIgc2VyaWFsaXplZFZhbHVlID0gcHJvdmlkZXIuc2NoZW1hLnNlcmlhbGl6ZShrZXksIGRlc2VyaWFsaXplZFZhbHVlLFxuICAgICAgICAgIHByb3ZpZGVyLnN0YXRlKTtcbiAgICAgIHZhciBwcm92aWRlclZhbHVlID0gcHJvdmlkZXIuc2NoZW1hLnNlcmlhbGl6ZShrZXksIHByb3ZpZGVyLnN0YXRlW2tleV0sXG4gICAgICAgICAgcHJvdmlkZXIuc3RhdGUpO1xuICAgICAgaWYgKHNlcmlhbGl6ZWRWYWx1ZSAhPT0gcHJvdmlkZXJWYWx1ZSkge1xuICAgICAgICBzdGF0ZVtrZXldID0gZGVzZXJpYWxpemVkVmFsdWU7XG4gICAgICAgIHByb3ZpZGVyLnN0YXRlW2tleV0gPSBkZXNlcmlhbGl6ZWRWYWx1ZTtcbiAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlW2tleV0gPSBkZXNlcmlhbGl6ZWRWYWx1ZTtcbiAgICAgIHByb3ZpZGVyLnN0YXRlW2tleV0gPSBkZXNlcmlhbGl6ZWRWYWx1ZTtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgfSwgdGhpcyk7XG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgcHJvdmlkZXIuY2FsbGJhY2soc3RhdGUpO1xuICB9XG59O1xuXG5cbi8qKlxuICogQ2FsbCB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggcmVnaXN0ZXJlZCBwcm92aWRlci5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24odGhpczpTdG9yZSwgT2JqZWN0KX0gY2FsbGJhY2sgQ2FsbGJhY2suXG4gKi9cblN0b3JlLnByb3RvdHlwZS5fZm9yRWFjaFByb3ZpZGVyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5fcHJvdmlkZXJzLmxlbmd0aDsgaSA8IGlpOyArK2kpIHtcbiAgICBjYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuX3Byb3ZpZGVyc1tpXSk7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBVcGRhdGUgdGhlIHN0b3JlJ3MgdmFsdWVzLCBub3RpZnlpbmcgcHJvdmlkZXJzIGFzIG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXMgTmV3IHZhbHVlcy5cbiAqL1xuU3RvcmUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICB0aGlzLl92YWx1ZXMgPSB2YWx1ZXM7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fZm9yRWFjaFByb3ZpZGVyKHRoaXMuX25vdGlmeVByb3ZpZGVyKTtcbiAgfS5iaW5kKHRoaXMpLCAwKTtcbn07XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuLyoqXG4gKiBHZXQgdGhlIHR5cGUgb2YgYSB2YWx1ZS5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlLlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgdHlwZS5cbiAqL1xuZXhwb3J0cy50eXBlT2YgPSBmdW5jdGlvbiB0eXBlT2YodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgdHlwZSA9ICdudWxsJztcbiAgICB9IGVsc2UgaWYgKHV0aWwuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHR5cGUgPSAnYXJyYXknO1xuICAgIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUodmFsdWUpKSB7XG4gICAgICB0eXBlID0gJ2RhdGUnO1xuICAgIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHR5cGUgPSAncmVnZXhwJztcbiAgICB9IGVsc2UgaWYgKHV0aWwuaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHR5cGUgPSAnZXJyb3InO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHlwZTtcbn07XG5cblxuLyoqXG4gKiBDb3B5IHByb3BlcnRpZXMgZnJvbSBvbmUgb2JqZWN0IHRvIGFub3RoZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgc291cmNlIG9iamVjdC5cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqL1xuZXhwb3J0cy5leHRlbmQgPSBmdW5jdGlvbihkZXN0LCBzb3VyY2UpIHtcbiAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgIGRlc3Rba2V5XSA9IHNvdXJjZVtrZXldO1xuICB9XG4gIHJldHVybiBkZXN0O1xufTtcblxuXG4vKipcbiAqIEdlbmVyYXRlIGFuIGFycmF5IG9mIGFsdGVybmF0aW5nIG5hbWUsIHZhbHVlIGZyb20gYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byB6aXAuXG4gKiBAcmV0dXJuIHtBcnJheX0gVGhlIGFycmF5IG9mIG5hbWUsIHZhbHVlIFssIG5hbWUsIHZhbHVlXSouXG4gKi9cbmV4cG9ydHMuemlwID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHZhciB6aXBwZWQgPSBbXTtcbiAgdmFyIGNvdW50ID0gMDtcbiAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgIHppcHBlZFsyICogY291bnRdID0ga2V5O1xuICAgIHppcHBlZFsyICogY291bnQgKyAxXSA9IG9iamVjdFtrZXldO1xuICAgICsrY291bnQ7XG4gIH1cbiAgcmV0dXJuIHppcHBlZDtcbn07XG5cblxuLyoqXG4gKiBHZW5lcmF0ZSBhbiBvYmplY3QgZnJvbSBhbiBhcnJheSBvZiBhbHRlcm5hdGluZyBuYW1lLCB2YWx1ZSBpdGVtcy5cbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSBvZiBuYW1lLCB2YWx1ZSBbLCBuYW1lLCB2YWx1ZV0qLlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgemlwcGVkIHVwIG9iamVjdC5cbiAqL1xuZXhwb3J0cy51bnppcCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gIHZhciBvYmplY3QgPSB7fTtcbiAgZm9yICh2YXIgaSA9IDAsIGlpID0gYXJyYXkubGVuZ3RoOyBpIDwgaWk7IGkgKz0gMikge1xuICAgIG9iamVjdFthcnJheVtpXV0gPSBhcnJheVtpICsgMV07XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn07XG5cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIl19
