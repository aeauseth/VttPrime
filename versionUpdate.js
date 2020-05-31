const { version } = require('./package.json');
const date = new Date();
const fs = require('fs');
fs.writeFileSync("src/appVer.js", "window.appVer = '" + version + " (" + date.toDateString() + ")';");