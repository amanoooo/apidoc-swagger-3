const path                = require('path');
const lib                 = require('../../lib');


const OPTIONS = {
    src: path.join(__dirname, './input'),
    template: path.join(__dirname, '../template/'),

    debug: false,
    silent: false,
    verbose: false,
    simulate: true, // does not write any file to disk
    colorize: true,
    markdown: true
}

test('simple file should be transformed correctly', () => {
    const generatedSwaggerData = lib.main(OPTIONS);
    const expectedSwaggerData = require('./output/swagger.json');
    expect(generatedSwaggerData).toEqual(expectedSwaggerData);
});
