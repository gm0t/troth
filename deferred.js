'use strict';
var Promise = require('./promise');

function Deferred() {
  this.isRejected = false;
  this.isFulfilled = false;
  this.promise = new Promise();
}

Deferred.prototype.resolve = function (value) {
  this.promise.$resolve(value);
};

Deferred.prototype.reject = function (e) {
  this.promise.$reject(e);
};

module.exports = Deferred;