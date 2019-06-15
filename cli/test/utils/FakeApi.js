module.exports = class FakeApi {
  constructor(mockValueObj) {
    Object.keys(mockValueObj).forEach(
      key =>
        (this[key] = function() {
          return this._wrappedResponse(mockValueObj[key]);
        })
    );
  }

  _wrappedResponse(values) {
    const { status, response, ok } = values;

    return new Promise((resolve, _reject) => {
      resolve({
        ok,
        status,
        text: () => new Promise((jsonRes, _jsonRej) => jsonRes(response)),
        json: () => new Promise((jsonRes, _jsonRej) => jsonRes(response))
      });
    });
  }
};
