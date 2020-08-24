

function generateLog(options) {
    var winston = require('winston');
    var log = winston.createLogger({
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
    return log
}

var apidoc = require('apidoc-core');
const apidoc_to_swagger = require('./apidoc_to_swagger');
apidoc.setGeneratorInfos({ name: 'name', time: new Date(), version: '0.0.1', url: 'xxx url' })


function main(options) {

    const { src, dest, verbose } = options
    const log = generateLog(options)
    apidoc.setLogger(log)

    log.verbose(options)


    console.log('options', options);
    var api = apidoc.parse({ ...options, log })

    if (options.parse !== true) {
        var apidocData = JSON.parse(api.data);
        var projectData = JSON.parse(api.project);

        const swagger = apidoc_to_swagger.toSwagger(apidocData, projectData)

        api["swaggerData"] = JSON.stringify(swagger);
        createOutputFile(api, options, log)
    }
}


const fs = require('fs')
const path = require('path')
function createOutputFile(api, options, log) {
    if (options.simulate)
        log.warn('!!! Simulation !!! No file or dir will be copied or created.');

    log.verbose('create dir: ' + options.dest);
    if (!options.simulate)
        fs.existsSync(options.dest) || fs.mkdirSync(options.dest);

    //Write swagger
    log.verbose('write swagger json file: ' + options.dest + 'swagger.json');
    if (!options.simulate)
        fs.writeFileSync(options.dest + './swagger.json', api.swaggerData);

}

exports.main = main