const tomlContent = {
  content: {
    name: 'chris@registry.entropic.dev/ds',
    version: '0.0.0-beta',
    dependencies: {
      '@iarna/toml': '^2.2.3',
      'legacy@registry.entropic.dev/figgy-pudding': '^3.5.1',
      'legacy@registry.entropic.dev/form-data': '^2.3.3',
      'legacy@registry.entropic.dev/minimist': '^1.2.0',
      'legacy@registry.entropic.dev/node-fetch': '^2.5.0',
      'legacy@registry.entropic.dev/npm-packlist': '^1.4.1',
      'legacy@registry.entropic.dev/npm-profile': '^4.0.1',
      'legacy@registry.entropic.dev/npmlog': '^4.1.2',
      'legacy@registry.entropic.dev/opener': '^1.5.1',
      'legacy@registry.entropic.dev/read-package-tree': '^5.2.2',
      'legacy@registry.entropic.dev/ssri': '^6.0.1',
      'legacy@registry.entropic.dev/user-home': '^2.0.0'
    }
  }
};

const fakeApiSuccessfulResponses = {
  pkgCheck: { status: 404, response: undefined },
  createPkg: {
    ok: true,
    status: 200,
    response: {
      name: 'test@registry.entropic.dev/entropic-test',
      yanked: false,
      created: Date.now(),
      modified: Date.now(),
      require_tfa: false,
      versions: {},
      tags: {}
    }
  },
  updatePkg: {
    status: 200,
    ok: true,
    response: {
      files: {
        './package/index.js': 'sha512-thisIsFake',
        './package/Package.toml': 'sha512-thisIsAlsoFake',
        derivedFiles: {},
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        bundledDependencies: {},
        created: '2019-06-15T13:41:37.721Z',
        modified: '2019-06-15T13:41:37.721Z',
        signatures: {}
      }
    }
  }
};

module.exports = {
  tomlContent,
  fakeApiSuccessfulResponses
};
