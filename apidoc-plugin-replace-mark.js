/**
 * Only a test and example plugin. It demonstrates the usage of the apidoc hook system.
 *
 * Hook overview: https://github.com/apidoc/apidoc-core/hooks.md
 */
var app = {};
let sample
let samplePath

const fs = require('fs')
const path = require('path')

module.exports = {

    init: function (_app) {
        app = _app;

        console.log('try add hooks');
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
        const tsFile = samplePath + 'index.ts'
        try {
            const { execSync } = require('child_process');
            execSync(`npx tsc ${tsFile}`)
            app.options.verbose && console.debug('tsc %s success', tsFile);
        } catch (error) {
            console.warn('[warn] tsc error', error)
        }
        const jsFile = path.join(process.env.PWD, samplePath + 'index.js')
        try {
            sample = require(jsFile)
            app.options.verbose && console.debug('find js file in %s', jsFile);
            if (sample.__esModule) {
                sample = sample.default
            }
        } catch (error) {
            console.warn('[warning] not found %s', jsFile)
            sample = {}
        }
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




const REG = /{{[a-zA-Z_\-:]+}}/g

function findValue(data) {

    const newData = data.replace(REG, function (_name, $1) {
        app.options.verbose && console.debug('find %s at %d', _name, $1)
        const name = _name.replace(/[{}]/g, '')

        const keys = name.split(':')
        let mayValue = sample
        for (let key of keys) {
            if (mayValue && mayValue.hasOwnProperty(key)) {
                mayValue = mayValue[key]
            } else {
                mayValue = undefined
            }
        }
        if (mayValue) {
            app.options.verbose && console.debug('replace %s in js file', name)
            return JSON.stringify(mayValue, null, 2)
        }

        const mayPath = `${keys.join('/')}.json`
        app.options.verbose && console.debug('try find value in mayPath %s', mayPath)
        try {
            const json = fs.readFileSync(path.join(process.env.PWD, samplePath, mayPath), 'utf-8')
            app.options.verbose && console.debug('replace %s in json file', name)
            return json
        } catch (e) {
            // console.debug('fail to find json file', mayPath)
        }

        // 返回默认值
        app.options.verbose && console.debug('use default value');
        return '{}';
    }
    )
    return newData
}