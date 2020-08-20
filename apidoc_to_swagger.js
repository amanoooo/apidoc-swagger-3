var _ = require('lodash');
var { pathToRegexp } = require('path-to-regexp');
const { debug, log } = require('winston');


console.log('pathToRegexp', pathToRegexp);
var swagger = {
    swagger: "3.0",
    info: {},
    paths: {},
    components: {
        schemas: {}
    }
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

            _.extend(obj, generateParameters(verb, swagger.components))
        }
    }
    return paths;
}

function generateParameters(verb, components) {
    console.log('verb', verb);

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
    console.log('query', query);
    console.log('body', body);
    console.log('header', header);

    const parameters = []
    parameters.push(...query.map(mapQueryItem))
    parameters.push(...header.map(mapHeaderItem))
    parameters.push(transferApidocParamsToSwaggerBody(body))

    const pathItemObject = {}
    pathItemObject[verb.type] = {
        tags: [verb.group],
        summary: removeTags(verb.description),
        consumes: [
            "application/json"
        ],
        produces: [
            "application/json"
        ],
        parameters
    }

    return pathItemObject

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
        '': parameter['schema']['properties']
    }

    params.forEach(i => {
        console.debug('handle body param', i);
        const type = i.type.toLowerCase()
        const key = i.field
        const nestedName = createNestedName(i.field)
        const { objectName = '', propertyName } = nestedName
        console.debug('objectName %s, propertyName %s ', objectName, propertyName);

        if (type.endsWith('object[]')) {
            mountPlaces[objectName][propertyName] = { type: 'array', items: { type: 'object', properties: {}, required: [] } }

            // new mount point
            console.log('due %s [%s] mount %s', key, type, propertyName);
            mountPlaces[key] = mountPlaces[objectName][propertyName]['items']['properties']
        } else if (type.endsWith('[]')) {
            mountPlaces[objectName][propertyName] = {
                items: {
                    type: type.slice(0, -2), description: i.description,
                    // default: i.defaultValue,
                    example: i.defaultValue
                },
                type: 'array'
            }
        } else if (type === 'object') {
            mountPlaces[objectName][propertyName] = { type: 'object', properties: {}, required: [] }

            // new mount point
            console.log('due %s [%s] mount %s', key, type, propertyName);
            mountPlaces[key] = mountPlaces[objectName][propertyName]['properties']
        } else {
            mountPlaces[objectName][propertyName] = {
                type,
                description: i.description,
                default: i.defaultValue,
            }
            // if (!i.optional) {
            //     console.log('xxxx', mountPlaces[objectName]);
            //     console.log('xxx', mountPlaces[objectName]['required']);
            //     mountPlaces[objectName]['required'].push(propertyName)
            // }
        }

        console.log('mountPlaces', mountPlaces)
    })

    console.log('xxparameter', parameter);

    return parameter
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