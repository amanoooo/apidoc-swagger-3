#!/usr/bin/env node

// This is used as an example in the README for:
//    Default option value
//    You can specify a default value for an option which takes a value.
//
// Example output pretending command called pizza-options (or try directly with `node options-defaults.js`)
//
// $ pizza-options
// cheese: blue
// $ pizza-options --cheese stilton
// cheese: stilton

// const commander = require('commander'); // (normal include)
const commander = require('commander'); // include commander in git clone of commander repo
const program = new commander.Command();

program
    .option('-v, --verbose', 'erbose debug output.', false)
    .option('-i, --input <string[]>', 'input dir', [])
    .option('-o, --output <string>', 'enable verbose', 'doc')
    .option('-d, --debug', 'Show debug messages.', false)
    .option('-c, --color', 'Show color', true)
    .option('-p, --parsee', 'Parse only the files and return the data, no file creation', false)
    .option('-s, --simulate', 'Execute but not write any file.', false)

program.parse(process.argv);

const { verbose, input, output, debug, color, parsee, simulate } = program

console.log('parsee', parsee);
const options = {
    src: input, dest: output, verbose, color, parse: parsee, simulate
}
console.log('options', options);

const { main } = require('./lib')


main(options)