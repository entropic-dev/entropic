const fs = require('fs');
const path = require('path');
const toml = require('@iarna/toml');
const osLocale = require('os-locale');

module.exports = translate;

let translations = null;
let locale = null;

const replace = (str, map) =>
  str.replace(/\{{2}(\S+?)\}{2}/gi, (_, key) => {
    if (key.startsWith('t:')) {
      if (map[key.slice(2)]) {
        return translate(map[key.slice(2)]);
      } else {
        return `{{${key.slice(2)}}}`;
      }
    } else {
      return map[key] || `{{${key}}}`;
    }
  });

function translate(key, substitutions = {}) {
  if (!translations) {
    translations = toml.parse(fs.readFileSync(path.resolve(__dirname, 'localization.toml'), 'utf8'));
  }

  if (!locale) {
    locale = osLocale.sync().toLowerCase();
  }

  const str = translations[key] && translations[key][locale] ? translations[key][locale] : key;

  return replace(str, substitutions);
}
