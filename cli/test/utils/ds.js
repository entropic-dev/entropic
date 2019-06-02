const path = require('path');
const child_process = require('child_process');

module.exports = ds;

const binPath = path.resolve(__dirname, '..', '..', 'lib', 'main.js');

const defaultOptions = { stdio: 'pipe' };

/**
 * Helper method that allows to run ds command as if it
 * is used from the command line
 *  
 * @param {string | string[]} args Argumets passed to the forked process 
 * @param {ForkOptions} options Fork options
 * 
 * @returns {Promise<{ stdout: string, stderr: string, code: number }>}
 */
function ds(args, options) {
  return new Promise((resolve, reject) => {
    const subprocess = child_process.fork(
      binPath,
      Array.isArray(args) ? args : args.split(' '),
      { ...defaultOptions, ...options }
    );

    let stdout = '';
    let stderr = '';

    subprocess.on('error', reject);

    if (subprocess.stdout) {
      subprocess.stdout.on('data', data => {
        stdout += data;
      });
    }

    if (subprocess.stderr) {
      subprocess.stderr.on('data', data => {
        stderr += data;
      });
    }

    subprocess.on('close', code => {
      resolve({ subprocess, stdout, stderr, code });
    });
  });
}
