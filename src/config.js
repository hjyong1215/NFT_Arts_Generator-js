const basePath = process.cwd();

// Setting network
const NETWORK = {
    eth: "eth",
};
const network = NETWORK.eth;

// Setting metadata for ethereum
const namePrefix = "Your Collection";
const description = "Your Description";
const baseUri = "ipfs://1234";
const extraMetadata = {};

// Setting layer configuration
const layerConfiguration = {
    editionSize: 100,
    layersOrder: [
        "background",
        "body",
        "eye",
        "eyewear",
        "suit",
    ]
};

// Setting art format
const format = {
    width: 256,
    height: 256
};

// Setting rarity & DNA delimiters
const rarityDelimiter = "#";
const dnaDelimiter = "-";

// Setting tolerance for finding unique DNA
const uniqueDnaTolerance = 1000;

module.exports = {
    network,
    namePrefix,
    description,
    baseUri,
    extraMetadata,
    layerConfiguration,
    format,
    rarityDelimiter,
    dnaDelimiter,
    uniqueDnaTolerance,
}
