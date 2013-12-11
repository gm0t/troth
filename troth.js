'use strict';
var Promise = require('./promise');
var Deferred = require('./deferred');
function fulfilled(value) {
  var p = new Promise();
  p.$resolve(value);
  return p;
}

function rejected(error) {
  var p = new Promise();
  p.$reject(error);
  return p;
}

function defer() {
  return new Deferred();
}

exports.defer = defer;
exports.deferred = defer;
exports.rejected = rejected;
exports.fulfilled = fulfilled;
exports.resolved = fulfilled;