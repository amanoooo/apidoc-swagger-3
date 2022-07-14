var _ = require('lodash');
var { pathToRegexp } = require('path-to-regexp');
const GenerateSchema = require('generate-schema');

var log;

function setLogger(logger) {
    log = logger;
}

var swagger = {
    openapi: '3.0.3',
    info: {},
    paths: {}
};

function toSwagger(apidocJson, projectJson) {
    swagger.info = addInfo(projectJson);
    swagger.paths = extractPaths(apidocJson);
    // for (const key in swagger) {
    //     console.log('[%s] %o', key, swagger[key]);
    // }
    return swagger;
}

var tagsRegex = /(<([^>]+)>)/ig;
// Removes <p> </p> tags from text
function removeTags(text) {
    return text ? text.replace(tagsRegex, "") : text;
}

function addInfo(projectJson) {  // cf. https://swagger.io/specification/#info-object
    var info = {};
    info["title"] = projectJson.title || projectJson.name;
    info["version"] = projectJson.version;
    info["description"] = projectJson.description;
    return info;
}

/**
 * Extracts paths provided in json format
 * post, patch, put request parameters are extracted in body
 * get and delete are extracted to path parameters
 * @param apidocJson
 * @returns {{}}
 */
function extractPaths(apidocJson) {  // cf. https://swagger.io/specification/#paths-object
    var apiPaths = groupByUrl(apidocJson);
    var paths = {};
    for (var i = 0; i < apiPaths.length; i++) {
        var verbs = apiPaths[i].verbs;
        var url = verbs[0].url;
        var pattern = pathToRegexp(url, null);
        var matches = pattern.exec(url);

        // Surrounds URL parameters with curly brackets -> :email with {email}
        var pathKeys = [];
        for (let j = 1; j < matches.length; j++) {
            var key = matches[j].substr(1);
            url = url.replace(matches[j], "{" + key + "}");
            pathKeys.push(key);
        }

        for (let j = 0; j < verbs.length; j++) {
            var verb = verbs[j];
            var type = verb.type;

            var obj = paths[url] = paths[url] || {};

            _.extend(obj, generateProps(verb))
        }
    }
    return paths;
}

function mapHeaderItem(i) {
    return {
        schema: {
            type: 'string',
            default: i.defaultValue
        },
        in: 'header',
        name: i.field,
        description: removeTags(i.description),
        required: !i.optional,
        default: i.defaultValue
    }
}

function mapQueryItem(i) {
    return {
        schema: {
            type: 'string',
            default: i.defaultValue
        },
        in: 'query',
        name: i.field,
        description: removeTags(i.description),
        required: !i.optional
    }
}

function mapPathItem(i) {
    return {
        schema: {
            type: 'string',
            default: i.defaultValue
        },
        in: 'path',
        name: i.field,
        description: removeTags(i.description),
        required: !i.optional
    }
}

/**
 * apiDocParams
 * @param {type} type
 * @param {boolean} optional
 * @param {string} field
 * @param {string} defaultValue
 * @param {string} description
 */

/**
 * 
 * @param {ApidocParameter[]} apiDocParams 
 * @param {*} parameter 
 */
function transferApidocParamsToSwaggerBody(apiDocParams, parameterInBody) {

    let mountPlaces = {
        '': Object.values(parameterInBody.content)[0]['schema']
    }

    apiDocParams.forEach(i => {
        const type = i.type.toLowerCase()
        const key = i.field
        const nestedName = createNestedName(i.field)
        const { objectName = '', propertyName } = nestedName

        if (!mountPlaces[objectName]['properties']) mountPlaces[objectName]['properties'] = {};

        if (type === 'object[]' || type === 'array') {
            // if schema(parsed from example) doesn't has this constructure, init
            if (!mountPlaces[objectName]['properties'][propertyName]) {
                mountPlaces[objectName]['properties'][propertyName] = { type: 'array', items: { type: 'object', properties: {} } }
            }

            // new mount point
            mountPlaces[key] = mountPlaces[objectName]['properties'][propertyName]['items']
        } else if (type.endsWith('[]')) {
            // if schema(parsed from example) doesn't has this constructure, init
            if (!mountPlaces[objectName]['properties'][propertyName]) {
                mountPlaces[objectName]['properties'][propertyName] = {
                    items: {
                        type: type.slice(0, -2), description: i.description,
                        example: i.defaultValue
                    },
                    type: 'array'
                }
            }
        } else if (type === 'object') {
            // if schema(parsed from example) doesn't has this constructure, init
            if (!mountPlaces[objectName]['properties'][propertyName]) {
                mountPlaces[objectName]['properties'][propertyName] = { type: 'object', properties: {} }
            }

            // new mount point
            mountPlaces[key] = mountPlaces[objectName]['properties'][propertyName]
        } else {
            mountPlaces[objectName]['properties'][propertyName] = {
                type,
                description: i.description
            }
        }
        if (!i.optional) {
            // generate-schema forget init [required]
            if (mountPlaces[objectName]['required']) {
                mountPlaces[objectName]['required'].push(propertyName)
            } else {
                mountPlaces[objectName]['required'] = [propertyName]
            }
        }
    })

    return parameterInBody
}
function generateProps(verb) {
    const pathItemObject = {}
    const parameters = generateParameters(verb)
    const responses = generateResponses(verb)
    pathItemObject[verb.type] = {
        tags: [verb.group],
        summary: removeTags(verb.name),
        description: removeTags(verb.title),
        parameters,
        responses
    }

    return pathItemObject
}

function generateParameters(verb) {

    const parameters = []

    const header = verb && verb.header && verb.header.fields.Header || []
    parameters.push(...header.map(mapHeaderItem))

    if (verb && verb.parameter && verb.parameter.fields) {

        const _path = verb.parameter.fields.Parameter || []
        const _query = verb.parameter.fields.Query || []
        const _body = verb.parameter.fields.Body || []

        parameters.push(..._path.map(mapPathItem))
        parameters.push(..._query.map(mapQueryItem))

        if (verb.type === 'post' || verb.type === 'put') {
            parameters.push(generateRequestBody(verb, _body))
        }
    }
    parameters.push(...(verb.query || []).map(mapQueryItem))

    return parameters
}

function generateRequestBody(verb, mixedBody) {
    const bodyParameter = {
        in: 'body',
        schema: {
            properties: {},
            type: 'object',
            required: []
        }
    }

    if (_.get(verb, 'parameter.examples.length') > 0) {
        for (const example of verb.parameter.examples) {
            const { code, json } = safeParseJson(example.content)
            const schema = GenerateSchema.json(example.title, json)
            bodyParameter.schema = schema
            bodyParameter.description = example.title
        }
    }

    transferApidocParamsToSwaggerBody(mixedBody, bodyParameter)

    return bodyParameter
}

function generateResponses(verb) {
    const success = verb.success
    const error = verb.error
    const responses = {}
    if (success && success.examples) {
        for (const example of success.examples) {
            generateResponse(example, responses);
        }
    }
    if (error && error.examples) {
        for (const example of error.examples) {
            generateResponse(example, responses);
        }
    }

    let code2xx = Object.keys(responses).filter((r => (c = parseInt(r), 200 <= c && c < 300)))[0];
    if (!code2xx) {
        mountResponseSpecSchema(verb, responses);
        responses[200] = {
            content: {
                'application/json': {
                    schema: {
                        properties: {},
                        type: 'object',
                        required: []
                    }
                }
            }
        }
    }

    mountResponseSpecSchema(verb, responses, code2xx)

    return responses
}

function generateResponse(example, responses) {
    const { code, json } = safeParseJson(example.content);
    const schema = GenerateSchema.json(example.title, json);
    delete schema.$schema;
    responses[code] = {
        content: {
            'application/json': {
                example: example.content,
                schema
            }
        },
        description: example.title
    };
}

function mountResponseSpecSchema(verb, responses, code2XX) {
    // if (verb.success && verb.success['fields'] && verb.success['fields']['Success 200']) {
    if (_.get(verb, 'success.fields.Success ' + code2XX)) {
        const apidocParams = verb.success['fields']['Success ' + code2XX]
        responses[code2XX] = transferApidocParamsToSwaggerBody(apidocParams, responses[code2XX])
    }
}

function safeParseJson(content) {
    // such as  'HTTP/1.1 200 OK\n' +  '{\n' + ...

    let startingIndex = 0;
    for (let i = 0; i < content.length; i++) {
        const character = content[i];
        if (character === '{' || character === '[') {
            startingIndex = i;
            break;
        }
    }

    const mayCodeString = content.slice(0, startingIndex)
    const mayContentString = content.slice(startingIndex)

    const mayCodeSplit = mayCodeString.trim().split(' ')
    let code = 200;
    if (mayCodeSplit.length > 1 && mayCodeSplit[0].toLowerCase().startsWith("http")) {
        let c = parseInt(mayCodeSplit[1]);
        if (!isNaN(c)) code = c;
    }

    let json = {}
    try {
        json = JSON.parse(mayContentString)
    } catch (error) {
        console.warn('parse error', error)
    }

    return {
        code,
        json
    }
}

function createNestedName(field, defaultObjectName) {
    let propertyName = field;
    let objectName;
    let propertyNames = field.split(".");
    if (propertyNames && propertyNames.length > 1) {
        propertyName = propertyNames.pop();
        objectName = propertyNames.join(".");
    }

    return {
        propertyName: propertyName,
        objectName: objectName || defaultObjectName
    }
}

function groupByUrl(apidocJson) {
    return _.chain(apidocJson)
        .groupBy("url")
        .toPairs()
        .map(function (element) {
            return _.zipObject(["url", "verbs"], element);
        })
        .value();
}

module.exports = {
    toSwagger, setLogger
};
