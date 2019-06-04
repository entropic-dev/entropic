const fs = require('fs');
const path = require('path');
const express = require('express');

const buildDir = path.join(__dirname, '..', 'build');

if (!fs.existsSync(buildDir)) {
  console.log(
    'Error: cannot find build directory. Please run `npm run build` in the parent directory'
  );
  process.exit(1);
}

const { PORT = 3001 } = process.env;

const ssr = require('./ssr');

const app = express();

// this could be done better but works to illustrate the basic idea
// - assets are served statically
// - application routes are passed through the ssr handler
app.get('/', ssr(buildDir));
app.get('/index.html', ssr(buildDir));
app.use(express.static(buildDir));
app.get('*', ssr(buildDir));

app.listen(PORT, () => console.log(`listening on :${PORT}`));
