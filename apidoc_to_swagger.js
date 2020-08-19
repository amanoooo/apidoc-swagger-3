var _ = require('lodash');
var { pathToRegexp } = require('path-to-regexp');
const { debug } = require('winston');


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

            if (type == 'post' || type == 'patch' || type == 'put') {
                _.extend(obj, createPostPushPutOutput(verb, swagger.components.schemas, pathKeys));
            } else {
                _.extend(obj, createGetDeleteOutput(verb, swagger.components.schemas));
            }
        }
    }
    return paths;
}

function createPostPushPutOutput(verbs, definitions, pathKeys) {
    console.log('createPostPushPutOutput', verbs, definitions, pathKeys);
    var pathItemObject = {};
    var verbDefinitionResult = createVerbDefinitions(verbs, definitions)
    console.log('verbDefinitionResult', verbDefinitionResult);

    var params = [];
    var pathParams = createPathParameters(verbs, pathKeys);
    console.log('pathParams', pathParams);
    pathParams = _.filter(pathParams, function (param) {
        var hasKey = pathKeys.indexOf(param.name) !== -1;
        return !(param.in === "path" && !hasKey)
    });
    console.log('pathParams', pathParams);

    params = params.concat(pathParams);
    var required = verbs.parameter && verbs.parameter.fields &&
        verbs.parameter.fields.Parameter && verbs.parameter.fields.Parameter.length > 0;

    params.push({
        // "in": "body",
        // "name": "body",
        "description": removeTags(verbs.description),
        "required": required,
        "schema": {
            "$ref": "#/components/schemas/" + verbDefinitionResult.topLevelParametersRef
        }
    });
    console.log('params', params)

    pathItemObject[verbs.type] = {
        tags: [verbs.group],
        summary: removeTags(verbs.description),
        consumes: [
            "application/json"
        ],
        produces: [
            "application/json"
        ],
        parameters: params
    }

    if (verbDefinitionResult.topLevelSuccessRef) {
        pathItemObject[verbs.type].responses = {
            "200": {
                "description": "successful operation",
                "schema": {
                    "type": verbDefinitionResult.topLevelSuccessRefType,
                    "items": {
                        "$ref": "#/components/schemas/" + verbDefinitionResult.topLevelSuccessRef
                    }
                }
            }
        };
    };

    return pathItemObject;
}

function createVerbDefinitions(verbs, definitions) {
    var result = {
        topLevelParametersRef: null,
        topLevelSuccessRef: null,
        topLevelSuccessRefType: null
    };
    var defaultObjectName = verbs.name;

    var fieldArrayResult = {};
    if (verbs && verbs.parameter && verbs.parameter.fields) {
        const Parameter = verbs.parameter.fields.Parameter || []
        const Query = verbs.parameter.fields.Query || []
        const Body = verbs.parameter.fields.Body || []
        fieldArrayResult = createFieldArrayDefinitions(Parameter.concat(Query, Body), definitions, verbs.name, defaultObjectName);
        result.topLevelParametersRef = fieldArrayResult.topLevelRef;
    };

    if (verbs && verbs.success && verbs.success.fields) {
        fieldArrayResult = createFieldArrayDefinitions(verbs.success.fields["Success 200"], definitions, verbs.name, defaultObjectName);
        result.topLevelSuccessRef = fieldArrayResult.topLevelRef;
        result.topLevelSuccessRefType = fieldArrayResult.topLevelRefType;
    };

    return result;
}

function createFieldArrayDefinitions(fieldArray, definitions, topLevelRef, defaultObjectName) {
    var result = {
        topLevelRef: topLevelRef,
        topLevelRefType: null
    }

    if (!fieldArray) {
        return result;
    }

    for (var i = 0; i < fieldArray.length; i++) {
        var parameter = fieldArray[i];
        console.log('createFieldArrayDefinitions [%d]', i, parameter);

        const nestedName = createNestedName(parameter.field, defaultObjectName);
        let objectName = nestedName.objectName
        let propertyName = nestedName.propertyName

        console.debug('nestedName', nestedName);

        var type = parameter.type;
        if (i == 0) {
            // mark
            result.topLevelRefType = type;
            if (parameter.type == "Object") {
                objectName = propertyName
                nestedName = null
            } else if (parameter.type == "Array") {
                objectName = propertyName
                propertyName = null
                result.topLevelRefType = "array";
            }
            result.topLevelRef = objectName;
        };

        definitions[objectName] = definitions[objectName] ||
            { properties: {}, required: [] };

        if (propertyName) {
            var prop = { type: (parameter.type || "").toLowerCase(), description: removeTags(parameter.description) };
            if (parameter.type == "Object") {
                prop.$ref = "#/definitions/" + parameter.field;
            }

            if (type.endsWith('[]')) {
                prop.type = "array";
                prop.items = {
                    type: type.slice(0, type.length - 2)
                };
            }

            console.debug('definitions[%s] add properties [%s]', objectName, propertyName)
            definitions[objectName]['properties'][propertyName] = prop;
            if (!parameter.optional) {
                var arr = definitions[objectName]['required'];
                if (arr.indexOf(propertyName) === -1) {
                    arr.push(propertyName);
                }
            };

        } else {
            console.log('not exist propertyName', nestedName);
        };
    }

    return result;
}

function createNestedName(field, defaultObjectName) {
    let propertyName = field;
    let objectName;
    let propertyNames = field.split(".");
    console.debug('propertyNames', propertyNames);
    if (propertyNames && propertyNames.length > 1) {
        propertyName = propertyNames.pop();
        objectName = propertyNames.join(".");
    }

    return {
        propertyName: propertyName,
        objectName: objectName || defaultObjectName
    }
}


/**
 * Generate get, delete method output
 * @param verbs
 * @returns {{}}
 */
function createGetDeleteOutput(verbs, definitions) {
    var pathItemObject = {};
    verbs.type = verbs.type === "del" ? "delete" : verbs.type;

    var verbDefinitionResult = createVerbDefinitions(verbs, definitions);
    pathItemObject[verbs.type] = {
        tags: [verbs.group],
        summary: removeTags(verbs.description),
        consumes: [
            "application/json"
        ],
        produces: [
            "application/json"
        ],
        parameters: createPathParameters(verbs)
    }
    if (verbDefinitionResult.topLevelSuccessRef) {
        pathItemObject[verbs.type].responses = {
            "200": {
                "description": "successful operation",
                "schema": {
                    "type": verbDefinitionResult.topLevelSuccessRefType,
                    "items": {
                        "$ref": "#/components/schemas/" + verbDefinitionResult.topLevelSuccessRef
                    }
                }
            }
        };
    };
    return pathItemObject;
}

/**
 * Iterate through all method parameters and create array of parameter objects which are stored as path parameters
 * @param verbs
 * @returns {Array}
 */
function createPathParameters(verbs, pathKeys) {
    pathKeys = pathKeys || [];

    var pathItemObject = [];
    if (verbs.parameter && verbs.parameter.fields.Parameter) {

        for (var i = 0; i < verbs.parameter.fields.Parameter.length; i++) {
            var param = verbs.parameter.fields.Parameter[i];
            console.log('param', param);
            var field = param.field;
            var type = param.type;
            pathItemObject.push({
                name: field,
                in: type === "file" ? "formData" : "path",
                required: !param.optional,
                type: param.type.toLowerCase(),
                description: removeTags(param.description)
            });

        }
    }
    return pathItemObject;
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