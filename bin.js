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
    .option('-i, --input <string[]>', 'input dir', collect, [])
    .option('-o, --output <string>', 'enable verbose', 'doc')
    .option('-c, --config <config>', 'Path to config file or to directory containing config file (apidoc.json or apidoc.config.js).', '')

    .option('--definitions', 'Include definitions file rather than copying definitions.', false)

    .option('-p, --private', 'Include private APIs in output.', false)

    .option('-v, --verbose', 'Verbose debug output.', false)

    .option('-d, --debug', 'Show debug messages.', false)

    .option('--color', 'Turn off log color.', true)

    // .option('--parse', 'Parse only the files and return the data, no file creation.', false)
    .option('-p, --parsee', 'Parse only the files and return the data, no file creation', false)
    .option('-s, --simulate', 'Execute but not write any file.', false)

program.parse(process.argv);

const { verbose, input, output, debug, color, parsee, simulate } = program

const options = {
    src: input, dest: output, verbose, color, parse: parsee, simulate
}
console.log('options', options);


/**
 * Collect options into an array
 * @param {String} value
 * @param {String[]} acc
 * @returns {String[]}
 */
function collect(value, acc) {
    acc.push(value);
    return acc;
}

const { main } = require('./lib')


main(options)