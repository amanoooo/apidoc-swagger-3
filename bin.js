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

var argv = program
    .option('-f --file-filters <file-filters>', 'RegEx-Filter to select files that should be parsed (multiple -f can be used).', collect, [])

    .option('-e, --exclude-filters <exclude-filters>', 'RegEx-Filter to select files / dirs that should not be parsed (many -e can be used).', collect, [])

    .option('-i, --input <string[]>', 'input dir', collect, [])
    .option('-o, --output <string>', 'enable verbose', './doc/')
    .option('--sample <string>', 'sample dir', './sample/')
    .option('-c, --config <config>', 'Path to config file or to directory containing config file (apidoc.json or apidoc.config.js).', '')

    .option('--definitions', 'Include definitions file rather than copying definitions.', false)

    .option('-p, --private', 'Include private APIs in output.', false)

    .option('-v, --verbose', 'Verbose debug output.', false)

    .option('-d, --debug', 'Show debug messages.', false)

    .option('--color', 'Turn off log color.', true)

    // .option('--parse', 'Parse only the files and return the data, no file creation.', false)
    .option('-p, --parsee', 'Parse only the files and return the data, no file creation', false)

    .option('--parse-filters <parse-filters>', 'Optional user defined filters. Format name=filename', collect, [])
    .option('--parse-languages <parse-languages>', 'Optional user defined languages. Format name=filename', collect, [])
    .option('--parse-parsers <parse-parsers>', 'Optional user defined parsers. Format name=filename', collect, [])
    .option('--parse-workers <parse-workers>', 'Optional user defined workers. Format name=filename', collect, [])


    .option('-s, --simulate', 'Execute but not write any file.', false)

program.parse(process.argv);

const { parsee } = program


const options = {
    excludeFilters: ['apidoc\\.config\\.js$'].concat(argv.excludeFilters.length ? argv.excludeFilters : []),
    includeFilters: argv.fileFilters.length ? argv.fileFilters : ['.*\\.(clj|cls|coffee|cpp|cs|dart|erl|exs?|go|groovy|ino?|java|js|jsx|kt|litcoffee|lua|mjs|p|php?|pl|pm|py|rb|scala|ts|vue)$'],
    src: argv.input.length ? argv.input : ['./'],
    dest: argv.output,
    verbose: argv.verbose,
    debug: argv.debug,
    parse: parsee,

    filters: transformToObject(argv.parseFilters),
    languages: transformToObject(argv.parseLanguages),
    parsers: transformToObject(argv.parseParsers),
    workers: transformToObject(argv.parseWorkers),

    colorize: argv.color,
    silent: argv.silent,
    simulate: argv.simulate,
    sample: argv.sample,
}

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

/**
 * Transform parameters to object
 *
 * @param {String|String[]} filters
 * @returns {Object}
 */
function transformToObject(filters) {
    if (!filters)
        return;

    if (typeof (filters) === 'string')
        filters = [filters];

    var result = {};
    filters.forEach(function (filter) {
        var splits = filter.split('=');
        if (splits.length === 2) {
            var obj = {};
            result[splits[0]] = path.resolve(splits[1], '');
        }
    });
    return result;
}
const { main } = require('./lib')


main(options)