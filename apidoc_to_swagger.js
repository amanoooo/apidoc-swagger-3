var _ = require('lodash');
var { pathToRegexp } = require('path-to-regexp');
const { debug, log } = require('winston');
const GenerateSchema = require('generate-schema')


console.log('pathToRegexp', pathToRegexp);
var swagger = {
    swagger: "3.0",
    info: {},
    paths: {}
};

function toSwagger(apidocJson, projectJson) {
    swagger.info = addInfo(projectJson);
    swagger.paths = extractPaths(apidocJson);
    for (const key in swagger) {
        console.log('[%s] %o', key, swagger[key]);
    }
    return swagger;
}

var tagsRegex = /(<([^>]+)>)/ig;
// Removes <p> </p> tags from text
function removeTags(text) {
    return text ? text.replace(tagsRegex, "") : text;
}

function addInfo(projectJson) {
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
function extractPaths(apidocJson) {
    var apiPaths = groupByUrl(apidocJson);
    var paths = {};
    for (var i = 0; i < apiPaths.length; i++) {
        var verbs = apiPaths[i].verbs;
        var url = verbs[0].url;
        var pattern = pathToRegexp(url, null);
        var matches = pattern.exec(url);
        console.log('matches', matches);
        console.log('url', url);

        // Surrounds URL parameters with curly brackets -> :email with {email}
        var pathKeys = [];
        for (let j = 1; j < matches.length; j++) {
            var key = matches[j].substr(1);
            url = url.replace(matches[j], "{" + key + "}");
            pathKeys.push(key);
        }
        console.log('pathKeys', pathKeys);

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
        type: 'string',
        in: 'header',
        name: i.field,
        description: removeTags(i.description),
        required: !i.optional,
        default: i.defaultValue
    }
}
function mapQueryItem(i) {
    return {
        type: 'string',
        in: 'query',
        name: i.field,
        description: removeTags(i.description),
        required: !i.optional,
        default: i.defaultValue
    }
}
function transferApidocParamsToSwaggerBody(params) {
    const parameter = {
        name: 'root',
        in: 'body',
        schema: {
            properties: {},
            type: 'object',
            required: []
        }
    }

    let mountPlaces = {
        '': parameter['schema']
    }

    params.forEach(i => {
        console.debug('handle body param', i);
        const type = i.type.toLowerCase()
        const key = i.field
        const nestedName = createNestedName(i.field)
        const { objectName = '', propertyName } = nestedName
        console.debug('objectName %s, propertyName %s ', objectName, propertyName);

        if (type.endsWith('object[]')) {
            mountPlaces[objectName]['properties'][propertyName] = { type: 'array', items: { type: 'object', properties: {}, required: [] } }

            // new mount point
            console.log('due %s [%s] mount %s', key, type, propertyName);
            mountPlaces[key] = mountPlaces[objectName]['properties'][propertyName]['items']
        } else if (type.endsWith('[]')) {
            mountPlaces[objectName]['properties'][propertyName] = {
                items: {
                    type: type.slice(0, -2), description: i.description,
                    // default: i.defaultValue,
                    example: i.defaultValue
                },
                type: 'array'
            }
        } else if (type === 'object') {
            mountPlaces[objectName]['properties'][propertyName] = { type: 'object', properties: {}, required: [] }

            // new mount point
            console.log('due %s [%s] mount %s', key, type, propertyName);
            mountPlaces[key] = mountPlaces[objectName]['properties'][propertyName]
        } else {
            mountPlaces[objectName]['properties'][propertyName] = {
                type,
                description: i.description,
                default: i.defaultValue,
            }
        }
        if (!i.optional) {
            mountPlaces[objectName]['required'].push(propertyName)
        }
        console.log('mountPlaces', mountPlaces)
    })

    console.log('xxparameter', parameter);

    return parameter
}
function generateProps(verb) {
    // console.log('verb', verb);


    const pathItemObject = {}
    const parameters = generateParameters(verb)
    const responses = generateResponses(verb)
    pathItemObject[verb.type] = {
        tags: [verb.group],
        summary: removeTags(verb.description),
        consumes: [
            "application/json"
        ],
        produces: [
            "application/json"
        ],
        parameters,
        responses
    }

    return pathItemObject

}

function generateParameters(verb) {
    const query = []
    const body = []
    const header = verb && verb.header && verb.header.fields.Header || []

    if (verb && verb.parameter && verb.parameter.fields) {

        const Parameter = verb.parameter.fields.Parameter || []
        const _query = verb.parameter.fields.Query || []
        const _body = verb.parameter.fields.Body || []
        query.push(..._query)
        body.push(..._body)
        if (verb.type === 'get') {
            query.push(...Parameter)
        } else {
            body.push(...Parameter)
        }
    };
    // console.log('query', query);
    // console.log('body', body);
    // console.log('header', header);

    const parameters = []
    parameters.push(...query.map(mapQueryItem))
    parameters.push(...header.map(mapHeaderItem))
    parameters.push(transferApidocParamsToSwaggerBody(body))

    return parameters
}


function generateResponses(verb) {
    const success = verb.success
    const responses = { 200: {} }
    if (!success || success.examples.length === 0) return {}
    for (const example of success.examples) {
        console.log('example', example);
        const { code, json } = safeParseJson(example.content)
        const schema = GenerateSchema.json(example.title, json)
        responses[code] = { schema, description: example.title }
    }
    return responses
}
function safeParseJson(content) {
    console.debug('old content', content)
    // such as  'HTTP/1.1 200 OK\n' +  '{\n' + ...
    const leftCurlyBraceIndex = content.indexOf('{')
    const mayCodeString = content.slice(0, leftCurlyBraceIndex)
    const mayContentString = content.slice(leftCurlyBraceIndex)

    const mayCodeSplit = mayCodeString.trim().split(' ')
    const code = mayCodeSplit.length === 3 ? parseInt(mayCodeSplit[1]) : 200

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
    toSwagger: toSwagger
};