const axios = require("axios");

async function getAndParseAssets(inputArray = []) {
    try {
        const response = await axios('https://api.fliplet.com/v1/widgets/assets');
        const { assets = {} } = response.data || {};

        return findAllAssetsPaths(assets, inputArray);
    } catch (error) {
        console.log("Error while fetching");
        throw error;
    }

}

function findAllAssetsPaths(assets, inputArray) {
    const filteredAsset = Object
        .entries(assets)
        .filter(([key]) => inputArray.some(item => key === item))
        .map(([_, value]) => value)
    if (!filteredAsset) return [];

    const result = []

    for (const asset of filteredAsset) {
        const minVersion = Object
            .keys(asset.versions)
            .reduce((a, b) => a > b ? a : b, '')
        result.push(asset.versions[minVersion])
        if (asset.dependencies) result.push(findAllAssetsPaths(assets, asset.dependencies).flat());
    }

    return removeDuplicates(result.flat());
}

function removeDuplicates(arr) {
    return [...new Set(arr)];
}

getAndParseAssets(['bootstrap', 'fliplet-core', 'moment', 'jquery'])
    .then((assets) => {
        /*
        Expected to have array of strings including all dependencies like:

         [
           'bootstrap-css.bundle.css',
           'bootstrap-js.bundle.js',
           'jquery.js',
           ...rest
         ]
         */
        console.log('List: ', assets);
        return assets;
    });