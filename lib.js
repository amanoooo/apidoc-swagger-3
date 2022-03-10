var app = {
    options: {}
}
var apidoc = require('apidoc')
var winston = require('winston');

const apidoc_to_swagger = require('./apidoc_to_swagger');

function generateLog() {
    var log = winston.createLogger({
        transports: [
            new (winston.transports.Console)({
                level: app.options.verbose ? 'verbose' : 'info',
                silent: false,
                prettyPrint: true,
                colorize: app.options.color,
                timestamp: false
            }),
        ]
    })
    app.options.log = log
    return log
}

function main(options) {
    app.options = options
    app.options.verbose && console.log('options', app.options);
    generateLog()
    options.verbose && console.log('options', options);

    var api = apidoc.createDoc({ ...app.options, log: app.options.log })

    if (app.options.parse !== true) {
        var apidocData = JSON.parse(api.data);
        var projectData = JSON.parse(api.project);

        const swagger = apidoc_to_swagger.toSwagger(apidocData, projectData)
        api["swaggerData"] = JSON.stringify(swagger);
        createOutputFile(api, app.options.log)
    }
}

const fs = require('fs')
const path = require('path')
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