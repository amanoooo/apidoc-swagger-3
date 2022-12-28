const fs = require('fs')
const path = require('path')
const winston = require('winston');
const apidoc = require('apidoc')

var app = {
    options: {}
}

const apidoc_to_swagger = require('./apidoc_to_swagger');

function generateLog(options) {
    app.options.log = winston.createLogger({
        transports: [
            new (winston.transports.Console)({
                level: options.verbose ? 'verbose' : 'info',
                silent: false,
                prettyPrint: true,
                colorize: options.color,
                timestamp: false
            }),
        ]
    })
}

function main(options) {
    app.options = options
    app.options.verbose && console.log('options', app.options);
    generateLog(options)
    options.verbose && console.log('options', options);

    var api = apidoc.createDoc({ ...app.options, log: app.options.log })

    if (!api) {
        console.log('No input data found, check your include/exclude filters');
        return
    }

    var apidocData = JSON.parse(api.data);
    var projectData = JSON.parse(api.project);

    // Replicate underscoreToSpace handlebar filter from https://github.com/apidoc/apidoc/blob/0.50.5/template/src/hb_helpers.js#L93
    for (let article of apidocData) {
        if (article.name)
            article.name = article.name.replace(/(_+)/g, ' ');
    }
    const swagger = apidoc_to_swagger.toSwagger(apidocData, projectData)
    api["swaggerData"] = JSON.stringify(swagger);
    createOutputFile(api, app.options.log)

    return swagger;
}

function createOutputFile(api, log) {
    log.verbose('create dir: ' + app.options.dest);
    if (!app.options.dryRun)
        fs.existsSync(app.options.dest) || fs.mkdirSync(app.options.dest);

    //Write swagger
    log.verbose('write swagger json file: ' + app.options.dest + 'swagger.json');
    if (!app.options.dryRun)
        fs.writeFileSync(app.options.dest + './swagger.json', api.swaggerData);

}

exports.main = main