#!/usr/bin/env node

const fs = require('fs');
const { resolve } = require('path');
const buildDir = resolve(__dirname, 'build');

// clean up old files
fs.readdirSync(buildDir)
  .filter(f => f.endsWith('.json'))
  .forEach(f => {
    fs.unlink(`${buildDir}/${f}`, err => {
      if (err) {
        throw err;
      }
    });
  });

// write new json files for kubectl
fs.readdirSync(resolve(__dirname, 'templates'))
  .filter(f => f.endsWith('.js'))
  .forEach(file => {
    fs.writeFileSync(
      resolve(buildDir, file.replace(/\.js$/, '.json')),
      JSON.stringify(require(`./templates/${file}`), null, 2)
    );
  });
