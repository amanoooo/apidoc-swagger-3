/**
 * Only a test and example plugin. It demonstrates the usage of the apidoc hook system.
 *
 * Hook overview: https://github.com/apidoc/apidoc-core/hooks.md
 */
var app = {};
let sample
let samplePath

module.exports = {

    init: function (_app) {
        app = _app;

        // Hooks
        //
        // Hooks with priority
        // Default is 100, you should select intervals in 10 steps.

        // Priority is usefull to execute something before or after other plugins
        // or overwrite their behavior.

        // Example if 2 Plugins have the same priority:
        // Both have priority 50 so Old will be ignored and overwritten with New
        app.addHook('parser-find-elements', replaceMark, 100);
        samplePath = app.options.sample
        sample = require(samplePath)
    }

};

/**
 * Replace all current elements.
 */
function replaceMark(elements, element, block, filename) {
    if (['apisuccessexample', 'apiparamexample', 'apierrorexample'].indexOf(element.name) > -1) {
        elements.pop()

        element.source = findValue(element.source)
        element.content = findValue(element.content)

        elements.push(element);
    }
    return elements;
}


const fs = require('fs')
const path = require('path')

const REG = /{{[a-zA-Z_\-:]+}}/g

function findValue(data) {

    const newData = data.replace(REG, function (_name, $1) {
        app.log.verbose('find %s at %d', _name, $1)
        const name = _name.replace(/[{}]/g, '')

        const keys = name.split(':')
        let mayValue = sample
        for (let key of keys) {
            if (mayValue && mayValue.hasOwnProperty(key)) {
                app.log.verbose('has %s', key)
                mayValue = mayValue[key]
            } else {
                app.log.verbose('sample not has ', key)
                mayValue = undefined
            }
        }
        if (mayValue) return JSON.stringify(mayValue, null, 2)

        const mayPath = `${keys.join('/')}.json`
        app.log.verbose('try find value in mayPath %s', mayPath)
        try {
            const json = fs.readFileSync(path.join(samplePath, mayPath), 'utf-8')
            app.log.verbose('find json file ', path.join(samplePath, mayPath));
            return json
        } catch (e) {
            app.log.verbose('fail to find json file', mayPath)
        }

        // 返回默认值
        app.log.verbose('use default value');
        return '{}';
    }
    )
    app.log.verbose('newData', newData)
    return newData
}