const basePath = process.cwd();
const {
    buildSetup,
    generate,
} = require(`${basePath}/src/main.js`);

buildSetup();
generate();