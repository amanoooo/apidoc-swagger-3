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
    .option('--encoding <string>', 'Set the encoding of the source code. [utf8].', 'utf8')
    .option('--line-ending <string>', 'Turn off autodetect line-ending. Allowed values: LF, CR, CRLF.', '\r\n')
    .option('--log-format <string>', 'Change log format. Allowed values: simple, json.', 'simple')
    .option('--markdown [bool]', 'Turn off default markdown parser or set a file to a custom parser.', true)
    .option('-n, --dry-run', 'Parse source files but do not write any output files.', false)
    .option('-p, --private', 'Include private APIs in output.', false)

    .option('-v, --verbose', 'Verbose debug output.', false)

    .option('-d, --debug', 'Show debug messages.', false)

    .option('--no-color', 'Turn off log color.', true)

    .option('--filter-by <<tag-filter=value>', 'Filter documentation by tag', '')
    .option('--parse-filters <parse-filters>', 'Optional user defined filters. Format name=filename', collect, [])
    .option('--parse-languages <parse-languages>', 'Optional user defined languages. Format name=filename', collect, [])
    .option('--parse-parsers <parse-parsers>', 'Optional user defined parsers. Format name=filename', collect, [])
    .option('--parse-workers <parse-workers>', 'Optional user defined workers. Format name=filename', collect, [])

program.parse(process.argv);

const { parsee } = program


const options = {
    excludeFilters: ['apidoc\\.config\\.js$'].concat(argv.excludeFilters.length ? argv.excludeFilters : []),
    includeFilters: argv.fileFilters.length ? argv.fileFilters : ['.*\\.(clj|cls|coffee|cpp|cs|dart|erl|exs?|go|groovy|ino?|java|js|jsx|kt|litcoffee|lua|mjs|p|php?|pl|pm|py|rb|scala|ts|vue)$'],
    src: argv.input.length ? argv.input : ['./'],
    dest: argv.output,
    verbose: argv.verbose,
    debug: argv.debug,
    dryRun: argv.dryRun,
    single: true, // build to single file

    encoding: argv.encoding,
    lineEnding: argv.lineEnding,
    logFormat: argv.logFormat,
    markdown: argv.markdown,

    filters: transformToObject(argv.parseFilters),
    languages: transformToObject(argv.parseLanguages),
    parsers: transformToObject(argv.parseParsers),
    workers: transformToObject(argv.parseWorkers),
    filterBy: argv.filterBy,

    color: argv.color,
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