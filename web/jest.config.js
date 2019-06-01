module.exports = {
  rootDir: 'src',
  preset: 'ts-jest',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  snapshotSerializers: ['enzyme-to-json']
};
