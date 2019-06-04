const path = require('path');
const fs = require('fs');

const getSEOMeta = require('./seo');

module.exports = buildDir => {
  const indexFile = path.join(buildDir, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.log('Error: could not find <buildDir>/index.html');
    process.exit(1);
  }

  const index = fs.readFileSync(indexFile, 'utf-8');
  let metaInsertionIndex = index.indexOf('<head>');
  if (metaInsertionIndex === -1) {
    console.log('Error: could not find document head');
    process.exit(1);
  }

  metaInsertionIndex += 6; // offset for length of <head>

  return (req, res) => {
    const meta = getSEOMeta(req.originalUrl);
    res
      .header('content-type', 'text/html')
      .status(200)
      .send(
        index.substring(0, metaInsertionIndex) +
          stringifyMeta(meta) +
          index.substring(metaInsertionIndex)
      );
  };
};

function stringifyMeta(metaArr) {
  return metaArr
    .map(meta => `<meta name="${meta.name}" content="${meta.content}" />`)
    .join('');
}
