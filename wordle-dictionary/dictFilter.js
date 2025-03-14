const fs = require('node:fs');

function filterJSON(inputFilePath, outputFilePath) {
    try {
        // 1. Read the JSON file
        const jsonData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

        //2.  Filter the JSON data
        const filteredData = Object.entries(jsonData).reduce((accumulator, [key, value]) => {
            if (hasUniqueChars(key)) {
              accumulator[key] = value;
            }
            return accumulator;
        }, {});

        // 3. Write the filtered data to a new JSON file
        fs.writeFileSync(outputFilePath, JSON.stringify(filteredData, null, 2)); //null,2 for pretty printing
        console.log("JSON file processed successfully!");

    } catch (error) {
        console.error("Error processing JSON file:", error);
    }
}

// Helper function to check for unique characters in a string
function hasUniqueChars(str) {
    return new Set(str).size === str.length;
}

//Example usage:
const inputFile = './fixed.json';  // Use our fixed JSON file
const outputFile = './clean.json'; // Output file for words with unique letters
filterJSON(inputFile, outputFile);