var Parser = require('..'),
  fs = require('fs'),
  assert = require('assert');

function inObject(object, property, value, returnObject) {
    var objectArray = Object.keys(object).map(function (key) { return object[key]; });
    
    for(var i in objectArray) {
        if(objectArray[i][property] === value) {
            if(returnObject) {
                return objectArray[i];
            }

            return true;
        }
    }

    return false;
}

describe('Parser', function () {
    describe('#()', function () {
        it('should have default keyword spec when none is passed', function () {
            assert((new Parser()).keywordSpec.gettext.length > 0);
          });
      });

    describe('#parse()', function () {
        it('should return results', function (done) {
            fs.readFile(__dirname + '/fixtures/template.html', {encoding: 'utf8'}, function (err, data) {
                if (err) {
                  throw err;
                }

                var result = (new Parser()).parse(data);

                assert.equal(typeof result, 'object');
                assert(inObject(result, 'msgid', 'inside block'));
                assert(inObject(result, 'msgid', 'inside block inverse'));
                assert(inObject(result, 'msgid', 'word \\"escaped, word\\", with comma'));
                assert(inObject(result, 'msgid', 'Testing contexts') && inObject(result, 'msgctxt', 'context1'));
                assert(inObject(result, 'msgid', 'Testing contexts') && inObject(result, 'msgctxt', 'context2'));
                assert.equal(Object.keys(result).length, 15);
                var imageDescriptionMessage = inObject(result, 'msgid', 'Image description', 'returnObject');
                assert.equal(imageDescriptionMessage.line.length, 2);

                done();
              });
          });

        it('should return plural results', function (done) {
            fs.readFile(__dirname + '/fixtures/plural.html', {encoding: 'utf8'}, function (err, data) {
                if (err) {
                  throw err;
                }

                var result = (new Parser()).parse(data);

                assert.equal(Object.keys(result).length, 4);
                assert.equal(inObject(result, 'msgid', 'default', 'returnObject').plural, 'defaults');
                assert(inObject(result, 'plural', 'quotes') && inObject(result, 'msgctxt', 'context3'));

                done();
              });
          });
      });
  });
