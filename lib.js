
var app = {
    options: {}
}
var apidoc = require('apidoc-core')
var winston = require('winston');

const apidoc_to_swagger = require('./apidoc_to_swagger');
apidoc.setGeneratorInfos({ name: 'name', time: new Date(), version: '0.0.1', url: 'xxx url' })


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
    const { src, dest, verbose } = options
    apidoc.setLogger(app.options.log)

    var api = apidoc.parse({ ...app.options, log: app.options.log })

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
    if (app.options.simulate)
        log.warn('!!! Simulation !!! No file or dir will be copied or created.');

    log.verbose('create dir: ' + app.options.dest);
    if (!app.options.simulate)
        fs.existsSync(app.options.dest) || fs.mkdirSync(app.options.dest);

    //Write swagger
    log.verbose('write swagger json file: ' + app.options.dest + 'swagger.json');
    if (!app.options.simulate)
        fs.writeFileSync(app.options.dest + './swagger.json', api.swaggerData);

}

exports.main = main