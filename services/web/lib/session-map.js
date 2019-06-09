'use strict';

module.exports = class SessionMap extends Map {
  constructor(...args) {
    super(...args);
    this.dirty = false;
  }

  set(key, value) {
    const current = this.get(key);
    const result = super.set(key, value);
    if (current !== value) {
      this.dirty = true;
    }
    return result;
  }

  delete(key) {
    const had = this.has(key);
    const result = super.delete(key);
    if (had) {
      this.dirty = true;
    }
    return result;
  }
};
