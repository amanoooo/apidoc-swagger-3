

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
    console.log('options', options);

    const { src, dest, verbose } = options
    const log = generateLog(options)
    apidoc.setLogger(log)


    var api = apidoc.parse({ src, dest, verbose, log })

    if (options.parse !== true) {
        var apidocData = JSON.parse(api.data);
        var projectData = JSON.parse(api.project);
        let index = 0
        for (const apidoc of apidocData) {
            for (const key in apidoc) {
                if (apidoc.hasOwnProperty(key)) {
                    console.log('apidoc[%d] [%s] %o', index, key, apidoc[key]);
                }
            }
            index++
        }

        console.log('projectData %o', projectData);
        const swagger = apidoc_to_swagger.toSwagger(apidocData, projectData)
        // for (const key in swagger) {
        // console.info('[%s] %o', key, swagger[key]);
        // }

        api["swaggerData"] = JSON.stringify(swagger);
        createOutputFile(api, options, log)
    }
}


const fs = require('fs')
const path = require('path')
function createOutputFile(api, options, log) {
    if (options.simulate) {
        log.warn('!!! Simulation !!! No file or dir will be copied or created.');
        return
    }
    console.log('options.dest', options.dest);

    const dir = path.join(__dirname, options.dest)
    fs.existsSync(dir) || fs.mkdirSync(path.join(__dirname, options.dest));

    //Write swagger
    log.verbose('write swagger json file: ' + options.dest + 'swagger.json');

    const newData = `"${api.swaggerData.replace(/"/g, "\\\"")}"`

    fs.writeFileSync(path.join(__dirname, options.dest, './swagger.json'), api.swaggerData);
    fs.writeFileSync(path.join(__dirname, options.dest, './swagger.text'), newData);
}

exports.main = main