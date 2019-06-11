module.exports = class FakeApi {
  constructor(response, status) {
    this.desiredResponse = response;
    this.desiredStatus = status;
  }

  async ping() {
    return new Promise((resolve, _reject) => {
      resolve({
        status: this.desiredStatus,
        message: 'OK',
        text: () => new Promise((jsonRes, _jsonRej) => jsonRes(this.desiredResponse))
      });
    });
  }

  async whoAmI() {
    return new Promise((resolve, _reject) => {
      resolve({
        status: this.desiredStatus,
        message: 'OK',
        json: () => new Promise((jsonRes, _jsonRej) => jsonRes(this.desiredResponse))
      });
    });
  }
};
