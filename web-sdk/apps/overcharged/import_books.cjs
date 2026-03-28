const fs = require('fs');
const path = require('path');

const mathBooksPath = path.resolve(__dirname, '../../../../OverCharged_Math/math-sdk/games/OverCharged/library/books');
const dataDir = path.resolve(__dirname, 'src/stories/data');

function convertBook(inputFileName, outputFileName) {
    const inputPath = path.join(mathBooksPath, inputFileName);
    const outputPath = path.join(dataDir, outputFileName);

    if (!fs.existsSync(inputPath)) {
        console.error(`File not found: ${inputPath}`);
        return;
    }

    const content = fs.readFileSync(inputPath, 'utf8');
    let books = JSON.parse(content);

    // Limit for Storybook performance
    const limit = 50;
    books = books.slice(0, limit);

    console.log(`Processing ${books.length} books from ${inputFileName}`);
    books.forEach((book, i) => {
        const skillEvents = book.events.filter(e => e.type === 'skillActivated');
        console.log(`  Book ${i + 1} (ID: ${book.id}): ${book.events.length} events, ${skillEvents.length} skill events`);
    });

    // Convert JSON books to string
    const stringified = JSON.stringify(books, null, '\t');

    fs.writeFileSync(outputPath, stringified, 'utf8');
    console.log(`Converted ${inputFileName} to ${outputFileName}`);
}

convertBook('books_base.json', 'base_books.json');
convertBook('books_bonus.json', 'bonus_books.json');

