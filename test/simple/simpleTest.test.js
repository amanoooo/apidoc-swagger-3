const path = require('path');
const lib = require('../../lib');
const { writeFileSync } = require('fs');


const OPTIONS = {
    src: path.join(__dirname, './input'),
    template: path.join(__dirname, '../template/'),

    debug: false,
    silent: false,
    verbose: false,
    dryRun: true, // does not write any file to disk
    colorize: true,
    markdown: true
}

test('simple file should be transformed correctly', () => {
    const generatedSwaggerData = lib.main(OPTIONS);
    const expectedSwaggerData = require('./output/swagger.json');
    console.log('expectedSwaggerData1', generatedSwaggerData);
    writeFileSync('xx.json', JSON.stringify(generatedSwaggerData, null, 2))
    expect(generatedSwaggerData).toEqual(expectedSwaggerData);
});
