'use strict';
var nextTick = require('./nextTick');
var id = 1;
function Promise() {
  this.id = id ++;
  //initial values
  this.isRejected = false;
  this.isFulfilled = false;
  this.isPerformDelayed = false;

  this.value = null;
  this.rejectionReason = null;

  this.handlers = {
    onFulfilled: [],
    onRejected: [],
    onProgress: []
  };

  this.$resolve = this.$resolve.bind(this);
  this.$reject = this.$reject.bind(this);

  this.then = this.then.bind(this);
  this.success = this.success.bind(this);
  this.done = this.done.bind(this);
  this.fail = this.fail.bind(this);
  this.error = this.error.bind(this);
  this.progress = this.progress.bind(this);
}

function compatibleResolve(x, then, onFulfilled, onRejected) {
  var done = false;
  var once = function (cb, n) {
    return function () {
      if (done) {
        return;
      }
      done = true;
      cb.apply(null, arguments);
    };
  };

  onFulfilled = once(onFulfilled, 'f');
  onRejected = once(onRejected, 'r');

  try {
    then.call(x, onFulfilled, onRejected);
  } catch (e) {
    onRejected(e);
  }
}

function resolve(promise, x) {
  var resolveWithY = function (y) {
    return resolve(promise, y);
  };

  if (promise === x) {
    return promise.$reject(new TypeError('You can`t resolve a promise with itself'));
  }

  if (x instanceof Promise) {
    return x.then(resolveWithY, promise.$reject);
  }

  var then;
  try {
    then = x ? x.then : null;
  } catch (e) {
    return promise.$reject(e);
  }

  if (typeof then === 'function') {
    return compatibleResolve(x, then, resolveWithY, promise.$reject);
  }

  return promise.$resolve(x);
}

function wrap(cb, promise2) {
  return function wrappedCallback(value) {
    var result;
    try {
      result = cb(value);
    } catch (e) {
      return promise2.$reject(e);
    }
    resolve(promise2, result);
  };
}

Promise.prototype.then = function (onFulfilled, onRejected, onProgress) {
  var p2 = new Promise();

  if (typeof onFulfilled !== 'function') {
    onFulfilled = p2.$resolve;
  }

  if (typeof onRejected !== 'function') {
    onRejected = p2.$reject;
  }

  this.handlers.onFulfilled.push(wrap(onFulfilled, p2));
  this.handlers.onRejected.push(wrap(onRejected, p2));

  if (typeof onProgress === 'function') {
    this.handlers.onProgress.push(onProgress);
  }

  this.$checkState();
  return p2;
};

Promise.prototype.$setState = function (state, value) {
  if (this.isRejected || this.isFulfilled) {
    return;
  }

  switch (state) {
    case 'rejected':
      this.isRejected = true;
      this.rejectionReason = value;
      break;
    case 'fulfilled':
      this.isFulfilled = true;
      this.value = value;
      break;
  }

  this.$checkState();
};

// private
Promise.prototype.$reject = function (reason) {
  return this.$setState('rejected', reason);
};

Promise.prototype.$resolve = function (value) {
  return this.$setState('fulfilled', value);
};

Promise.prototype.$checkState = function () {
  if (!this.isFulfilled && !this.isRejected) {
    return;
  }
  var perform,
    clear,
    result;

  if (this.isFulfilled) {
    perform = this.handlers.onFulfilled;
    clear = this.handlers.onRejected;
    result = this.value;
  } else if (this.isRejected) {
    perform = this.handlers.onRejected;
    clear = this.handlers.onFulfilled;
    result = this.rejectionReason;
  }

  //always clear 'onProgess' handler
  this.handlers.onProgress.length = 0;
  clear.length = 0;
  if (this.isPerformDelayed) {
    return;
  }
  this.isPerformDelayed = true;
  var me = this;
  nextTick(function () {
    var l = perform.length;
    me.isPerformDelayed = false;
    // console.log('resolve #' + me.id, result);
    while (l --) {
      perform.shift().call(null, result);
    }
  });
};

// helpers
Promise.prototype.success = function (cb) {
  return this.then(cb);
};

Promise.prototype.fail = function (cb) {
  return this.then(null, cb);
};

Promise.prototype.progress = function (cb) {
  return this.then(null, null, cb);
};
// ~helpers

//aliases
Promise.prototype.done = Promise.prototype.success;
Promise.prototype.error = Promise.prototype.fail;
// ~symlinks

module.exports = Promise;