const basePath = process.cwd();
const buildDir = `${basePath}/build`;

const fs = require("fs");
const sha1 = require(`${basePath}/node_modules/sha1`);
const {
    createCanvas,
    loadImage,
} = require(`${basePath}/node_modules/canvas`);
const {
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
} = require(`${basePath}/src/config.js`);

// DNA list initialization
const dnaList = new Set();

// Metadata list & attributes list initialization
let metadataList = [];
let attributesList = [];

// Canvas initialization
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");

// Initializing build directory
const buildSetup = () => {
    if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, {recursive: true});
    }
    fs.mkdirSync(buildDir);
    fs.mkdirSync(`${buildDir}/json`);
    fs.mkdirSync(`${buildDir}/images`);
};

// Layer setup
const cleanName = (filename) => {
    const nameWithoutExtension = filename.slice(0, -4);
    const nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
    return nameWithoutWeight;
};

const getWeight = (filename) => {
    const nameWithoutExtension = filename.slice(0, -4);
    let weight = Number(nameWithoutExtension.split(rarityDelimiter).pop());
    if (isNaN(weight)) {
        weight = 1;
    }
    return weight;
};

const getElements = (layerName) => {
    return fs
        .readdirSync(`${basePath}/layers/${layerName}`)
        .filter((item) => /.png$/g.test(item))
        .map((item, index) => ({
            id: index,
            name: cleanName(item),
            filename: item,
            path: `${basePath}/layers/${layerName}/${item}`,
            weight: getWeight(item),
        }));
};

const layersSetup = (layersOrder) => {
    return layersOrder.map((layer, index) => ({
        id: index,
        elements: getElements(layer),
        name: layer,
    }));
};

/* 
 * Picking random images from each layers reflecting weights
 * return DNA before encrypting (encrypting algorithm: SHA1)
 */
const pickRandomImages = (layers) => {
    let randomlyPickedImages = [];
    layers.forEach((layer) => {
        let totalWeight = 0;
        layer.elements.forEach((element) => {
            totalWeight += element.weight
        });
        let random = Math.floor(Math.random() * totalWeight);
        for (let i = 0; i < layer.elements.length; i++) {
            random -= layer.elements[i].weight;
            if (random < 0) {
                randomlyPickedImages.push(`${layer.elements[i].id}`);
                return;
            }
        }
    });
    return randomlyPickedImages.join(dnaDelimiter);
};

// Checking DNA overlapping
const isDnaUnique = (dna) => {
    return !dnaList.has(dna); // if dna in dnaList -> return false
};

// Creating DNA & adding DNA to dnaList
let failCount = 0;
const createDna = (layers) => {
    const tempDna = pickRandomImages(layers);
    if (isDnaUnique(tempDna)) {
        dnaList.add(tempDna);
        return tempDna;
    } else {
        failCount++;
        if (failCount <= uniqueDnaTolerance) {
            console.log("DNA already exists. Retry...");
            return createDna(layers);
        } else {
            console.log("WARNING: You need more layers or elements.");
            console.log("Program terminated...");
            buildSetup();
            process.exit();
        }
    }
};

// Creating arts
// Constructing array of objects that have information about picked images according to dna
const getPickedImagesInfo = (dna, layers) => {
    const pickedImagesInfo = layers.map((layer, index) => {
        const pickedElement = layer.elements.find(
            (element) => element.id == dna.split(dnaDelimiter)[index]
        );
        return {
            name: layer.name,
            pickedElement: pickedElement,
        }; 
    });
    return pickedImagesInfo;
};

// Loading an image from layer -> renderObject
const loadLayerImg = (imageInfo) => {
    return new Promise(async (resolve) => {
        const image = await loadImage(imageInfo.pickedElement.path);
        resolve({
            layer: imageInfo,
            loadedImage: image,
        });
    });
};

// Loading all picked images -> renderObjects
const loadAllImg = (imagesInfo) => {
    const loadedImages = [];
    imagesInfo.forEach((imageInfo) => {
        loadedImages.push(loadLayerImg(imageInfo));
    });
    return Promise.all(loadedImages);
};

// Adding attributes to attributesList
const addAttributes = (renderObject) => {
    attributesList.push({
        trait_type: renderObject.layer.name,
        value: renderObject.layer.pickedElement.name,
    });
};

// Drawing an element
const drawElement = (renderObject) => {
    ctx.drawImage(
        renderObject.loadedImage,
        0, 0,
        format.width, format.height
    );
    addAttributes(renderObject);
};

// Saving an image
const saveImage = (editionCount) => {
    fs.writeFileSync(
        `${buildDir}/images/${editionCount}.png`,
        canvas.toBuffer("image/png")
    );
};

// Creating metadata
// Adding metadata to metadataList
const addMetadata = (dna, editionCount) => {
    const dateTime = Date.now();
    const tempMetadata = {
        name: `${namePrefix} #${editionCount}`,
        description: description,
        image: `${baseUri}/${editionCount}.png`,
        dna: sha1(dna),
        edition: editionCount,
        date: dateTime,
        ...extraMetadata,
        attributes: attributesList,
        compiler: "NFT_Arts_Generator-js",
    };
    metadataList.push(tempMetadata);
    attributesList = [];
};

// Writing a json file of all editions' metadata
const writeMetadataAll = () => {
    fs.writeFileSync(
        `${buildDir}/json/_metadata.json`,
        JSON.stringify(metadataList, null, 2)
    );
};

// Writing a json file of single edition's metadata
const writeMetadataSingle = (editionCount) => {
    const metadata = metadataList.find((data) => data.edition == editionCount);
    fs.writeFileSync(
        `${buildDir}/json/${editionCount}.json`,
        JSON.stringify(metadata, null, 2)
    );
};

// Generating
const generate = async () => {
    // Layer setup
    const layersConfig = layersSetup(layerConfiguration.layersOrder);
    // Loop to generate editions 
    for (
        let editionCount = 1;
        editionCount <= layerConfiguration.editionSize;
        editionCount++
        ) {
            // Clearing canvas
            ctx.clearRect(0, 0, format.width, format.height);
            // Creating DNA & adding DNA to dnaList
            const tempDna = createDna(layersConfig);
            // Constructing array of objects that have information about picked images according to dna
            const pickedImagesInfo = getPickedImagesInfo(tempDna, layersConfig);
            // Loading all picked images -> renderObjects
            await loadAllImg(pickedImagesInfo).then((loadedImages) => {
                // Drawing
                for (let i = 0; i < loadedImages.length; i++) {
                    drawElement(loadedImages[i]);
                }
            });
            // Adding metadata
            addMetadata(tempDna, editionCount);
            // Writing a json file of edition's metadata
            writeMetadataSingle(editionCount);
            // Saving edition
            saveImage(editionCount);
            console.log(`Created edition: ${editionCount}, with DNA: ${sha1(tempDna)}`);
        }
        // Writing a json file of all editions' metadata
        writeMetadataAll();
};

module.exports = {
    buildSetup,
    generate,
}
