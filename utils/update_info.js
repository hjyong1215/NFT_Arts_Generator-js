/* This script can update generated editions'
 * 1. name
 * 2. description
 * 3. base URI
 */

const basePath = process.cwd();

const fs = require("fs");
const {
    namePrefix,
    description,
    baseUri,
} = require(`${basePath}/src/config.js`);

const rawdata = fs.readFileSync(`${basePath}/build/json/_metadata.json`);
const data = JSON.parse(rawdata);

data.forEach(item => {
    item.name = `${namePrefix} #${item.edition}`;
    item.description = description;
    item.image = `${baseUri}/${item.edition}.png`;
    fs.writeFileSync(
        `${basePath}/build/json/${item.edition}.json`,
        JSON.stringify(item, null, 2)
    );
});

fs.writeFileSync(
    `${basePath}/build/json/_metadata.json`,
    JSON.stringify(data, null, 2)
);

console.log(`Updated name to ===> ${namePrefix}`);
console.log(`Updated description to ===> ${description}`);
console.log(`Updated base URI to ===> ${baseUri}`);