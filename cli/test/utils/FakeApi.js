module.exports = class FakeApi {
  constructor(response, status) {
    this.desiredResponse = response;
    this.desiredStatus = status;
  }

  async whoAmI() {
    return new Promise((resolve, reject) => {
      resolve({
        status: this.desiredStatus,
        message: 'OK',
        json: () =>
          new Promise((jsonRes, _jsonRej) => jsonRes(this.desiredResponse))
      });
    });
  }
};
