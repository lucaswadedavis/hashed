var util = require('./util');

var deserializers = {
  string: function(str) {
    if (!str || typeof str !== 'string') {
      throw new Error('Expected string to deserialize: ' + str);
    }
    return str;
  },
  number: function(str) {
    if (!str || typeof str !== 'string') {
      throw new Error('Expected string to deserialize: ' + str);
    }
    var num = Number(str);
    if (isNaN(num)) {
      throw new Error('Expected to deserialize a number: ' + str);
    }
    return num;
  },
  date: function(str) {
    if (!str || typeof str !== 'string') {
      throw new Error('Expected string to deserialize: ' + str);
    }
    var date = new Date(str);
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
      array = JSON.parse(str);
    } catch (err) {
      // pass
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
      obj = JSON.parse(str);
    } catch (err) {
      // pass
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