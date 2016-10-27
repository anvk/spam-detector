'use strict';

var _chai = require('chai');

var _spamDetector = require('../dist/spamDetector.js');

var _spamDetector2 = _interopRequireDefault(_spamDetector);

var _proxyquire = require('proxyquire');

var _proxyquire2 = _interopRequireDefault(_proxyquire);

var _isWindows = require('is-windows');

var _isWindows2 = _interopRequireDefault(_isWindows);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } /* global it, describe, before, after */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

describe('spam-detector tests', function () {
  var spamDetector = void 0;

  before(function () {
    return spamDetector = new _spamDetector2.default();
  });

  after(function () {
    return spamDetector = undefined;
  });

  describe('_computeTfs tests', function () {
    var sampleWords = ['cat', 'catch', 'grey', 'mouse'];
    var sampleBagOfWords = ['cat', 'mouse'];
    var wordCount = sampleWords.length;

    it('empty tokenizedEmailText', function () {
      var errorMessage = '_computeTfs(): Error - email with empty body was passed!';

      (0, _chai.expect)(function () {
        return spamDetector._computeTfs(undefined, sampleBagOfWords);
      }).to.throw(errorMessage);
    });

    it('empty bagOfWords', function () {
      var errorMessage = '_computeTfs(): Error - bagOfWords cannot be empty!';

      (0, _chai.expect)(function () {
        return spamDetector._computeTfs(sampleWords);
      }).to.throw(errorMessage);
    });

    it('example 1. some words not in bagOfWords', function () {
      var tf = 1 / wordCount;

      var resultMap = spamDetector._computeTfs(sampleWords, sampleBagOfWords);
      var resultValues = [].concat(_toConsumableArray(resultMap.values()));

      (0, _chai.expect)(resultValues).to.deep.equal([tf, tf]);
    });

    it('example 2. some words appear more than once', function () {
      var sampleWords = ['cat', 'catch', 'grey', 'mouse', 'and', 'mouse'];
      var wordCount = sampleWords.length;
      var sampleBagOfWords = ['cat', 'mouse', 'Alex'];

      var resultMap = spamDetector._computeTfs(sampleWords, sampleBagOfWords);
      var resultValues = [].concat(_toConsumableArray(resultMap.values()));

      (0, _chai.expect)(resultValues).to.deep.equal([1 / wordCount, 2 / wordCount, 0]);
    });
  });

  describe('_computeIdfs tests', function () {
    var sampleTokenizedEmails = [{
      text: ['cat', 'catch', 'grey', 'mouse']
    }, {
      text: ['cat', 'lick', 'white', 'mouse']
    }];
    var sampleBagOfWords = ['cat', 'catch', 'white', 'mouse'];
    var docCount = sampleTokenizedEmails.length;

    it('empty tokenizedEmails', function () {
      var errorMessage = '_computeIdfs(): Error - tokenizedEmails cannot be empty!';

      (0, _chai.expect)(function () {
        return spamDetector._computeIdfs(undefined, sampleBagOfWords);
      }).to.throw(errorMessage);
    });

    it('empty bagOfWords', function () {
      var errorMessage = '_computeIdfs(): Error - bagOfWords cannot be empty!';

      (0, _chai.expect)(function () {
        return spamDetector._computeIdfs(sampleTokenizedEmails);
      }).to.throw(errorMessage);
    });

    it('Proper execution', function () {
      var resultMap = spamDetector._computeIdfs(sampleTokenizedEmails, sampleBagOfWords);
      var resultValues = [].concat(_toConsumableArray(resultMap.values()));

      (0, _chai.expect)(resultValues).to.deep.equal([0, 0.6931471805599453, 0.6931471805599453, 0]);
    });

    it('One of the tokenizedEmails is empty OR does not have text property', function () {
      var wrongSampleTokenizedEmails = [].concat(sampleTokenizedEmails, [{}]);

      var errorMessage = '_computeIdfs(): Error - tokenizedEmail is missing text property!';

      (0, _chai.expect)(function () {
        return spamDetector._computeIdfs(wrongSampleTokenizedEmails, sampleBagOfWords);
      }).to.throw(errorMessage);
    });
  });

  describe('_generateBagOfWords tests', function () {
    var sampleTokenizedEmails = [{
      text: ['three_A', 'three_A', 'three_A', 'three_B']
    }, {
      text: ['three_B', 'three_B', 'two_A', 'one_A']
    }, {
      text: ['two_B', 'two_B', 'two_A', 'one_B']
    }];

    it('empty tokenizedEmails', function () {
      var errorMessage = '_generateBagOfWords(): Error - tokenizedEmails cannot be empty!';

      (0, _chai.expect)(function () {
        return spamDetector._generateBagOfWords();
      }).to.throw(errorMessage);
    });

    it('empty bagOfWords', function () {
      var errorMessage = '_generateBagOfWords(): Error - Bag of Words must have at least 1 word';

      (0, _chai.expect)(function () {
        return spamDetector._generateBagOfWords(sampleTokenizedEmails, 0);
      }).to.throw(errorMessage);
    });

    it('One of the tokenizedEmails is empty OR does not have text property', function () {
      var wrongSampleTokenizedEmails = [].concat(sampleTokenizedEmails, [{}]);

      var errorMessage = '_generateBagOfWords(): Error - tokenizedEmail is missing text property!';

      (0, _chai.expect)(function () {
        return spamDetector._generateBagOfWords(wrongSampleTokenizedEmails);
      }).to.throw(errorMessage);
    });

    it('Proper execution', function () {
      var result = spamDetector._generateBagOfWords(sampleTokenizedEmails);

      (0, _chai.expect)(result).to.deep.equal(['one_A', 'one_B', 'three_A', 'three_B', 'two_A', 'two_B']);
    });

    it('Proper execution. Get only first 4 common words', function () {
      var result = spamDetector._generateBagOfWords(sampleTokenizedEmails, 4);

      (0, _chai.expect)(result).to.deep.equal(['three_A', 'three_B', 'two_A', 'two_B']);
    });
  });

  describe('_vectorize tests', function () {
    var sampleTokenizedEmails = [{
      text: ['the', 'cat', 'sat', 'on', 'my', 'face']
    }, {
      text: ['the', 'dog', 'sat', 'on', 'my', 'bed']
    }];

    var sampleBagOfWords = ['bed', 'cat', 'dog', 'face', 'my', 'on', 'sat', 'the'];

    it('empty tokenizedEmails', function () {
      var errorMessage = '_vectorize(): Error - tokenizedEmails cannot be empty!';

      (0, _chai.expect)(function () {
        return spamDetector._vectorize(undefined, sampleBagOfWords);
      }).to.throw(errorMessage);
    });

    it('bowLength is below 1', function () {
      var errorMessage = '_vectorize(): Error - bagOfWords cannot be empty!';

      (0, _chai.expect)(function () {
        return spamDetector._vectorize(sampleTokenizedEmails, 0);
      }).to.throw(errorMessage);
    });

    it('One of the tokenizedEmails is empty OR does not have text property', function () {
      var wrongSampleTokenizedEmails = [].concat(sampleTokenizedEmails, [{}]);

      // since computeIdf is calculated before hand
      var errorMessage = '_computeIdfs(): Error - tokenizedEmail is missing text property!';

      (0, _chai.expect)(function () {
        return spamDetector._vectorize(wrongSampleTokenizedEmails, sampleBagOfWords);
      }).to.throw(errorMessage);
    });

    // taken from https://www.youtube.com/watch?v=hXNbFNCgPfY
    it('Proper execution', function () {
      var result = spamDetector._vectorize(sampleTokenizedEmails, sampleBagOfWords);

      var resultArray = [[].concat(_toConsumableArray(result[0].entries())), [].concat(_toConsumableArray(result[1].entries()))];

      (0, _chai.expect)(resultArray).to.deep.equal([[['bed', 0], ['cat', 0.11552453009332421], ['dog', 0], ['face', 0.11552453009332421], ['my', 0], ['on', 0], ['sat', 0], ['the', 0]], [['bed', 0.11552453009332421], ['cat', 0], ['dog', 0.11552453009332421], ['face', 0], ['my', 0], ['on', 0], ['sat', 0], ['the', 0]]]);
    });
  });

  // TBD: need more rich tests
  describe('_preprocessEmailText tests', function () {
    it('wrong input', function () {
      var errorMessage = '_preprocessEmailText(): Error - text has to be a string!';

      var testCases = [undefined, 1, {}, [1, 2, 3], null, function () {}];

      testCases.forEach(function (testCase) {
        return (0, _chai.expect)(function () {
          return spamDetector._preprocessEmailText(testCase);
        }).to.throw(errorMessage);
      });
    });

    it('to lower case', function () {
      var testCases = [{
        input: 'Hello MistER CaT',
        output: ['hello', 'mister', 'cat']
      }];

      testCases.forEach(function (testCase) {
        return (0, _chai.expect)(spamDetector._preprocessEmailText(testCase.input)).to.deep.equal(testCase.output);
      });
    });

    it('handle url', function () {
      var testCases = [{
        input: 'hello mister cat https://github.com/anvk/',
        output: ['hello', 'mister', 'cat', 'httpaddr']
      }];

      testCases.forEach(function (testCase) {
        return (0, _chai.expect)(spamDetector._preprocessEmailText(testCase.input)).to.deep.equal(testCase.output);
      });
    });

    it('handle email address', function () {
      var testCases = [{
        input: 'hello mister cat alexey.novak.mail@gmail.com',
        output: ['hello', 'mister', 'cat', 'emailaddr']
      }];

      testCases.forEach(function (testCase) {
        return (0, _chai.expect)(spamDetector._preprocessEmailText(testCase.input)).to.deep.equal(testCase.output);
      });
    });

    it('handle dollar sign', function () {
      var testCases = [{
        input: 'hello mister cat $50',
        output: ['hello', 'mister', 'cat', 'dollar']
      }];

      testCases.forEach(function (testCase) {
        return (0, _chai.expect)(spamDetector._preprocessEmailText(testCase.input)).to.deep.equal(testCase.output);
      });
    });

    it('handle punctuation', function () {
      var testCases = [{
        input: 'hello mister cat!',
        output: ['hello', 'mister', 'cat']
      }];

      testCases.forEach(function (testCase) {
        return (0, _chai.expect)(spamDetector._preprocessEmailText(testCase.input)).to.deep.equal(testCase.output);
      });
    });

    it('handle numbers', function () {
      var testCases = [{
        input: 'hello mister cat 800',
        output: ['hello', 'mister', 'cat', 'number']
      }];

      testCases.forEach(function (testCase) {
        return (0, _chai.expect)(spamDetector._preprocessEmailText(testCase.input)).to.deep.equal(testCase.output);
      });
    });

    it('handle spaces', function () {
      var testCases = [{
        input: 'hello    mister       cat',
        output: ['hello', 'mister', 'cat']
      }];

      testCases.forEach(function (testCase) {
        return (0, _chai.expect)(spamDetector._preprocessEmailText(testCase.input)).to.deep.equal(testCase.output);
      });
    });

    it('handle stemming', function () {
      var testCases = [{
        input: 'I saw lots of mouses in the attic today',
        output: ['saw', 'lot', 'mous', 'attic', 'todai']
      }];

      testCases.forEach(function (testCase) {
        return (0, _chai.expect)(spamDetector._preprocessEmailText(testCase.input)).to.deep.equal(testCase.output);
      });
    });
  });

  describe('_readEmail tests', function () {
    it('trainPath is missing', function () {
      var errorMessage = '_readEmail(): Error - trainPath cannot be empty!';

      spamDetector._readEmail().catch(function (error) {
        return (0, _chai.expect)(error).to.throw(errorMessage);
      });
    });

    it('name is missing', function () {
      var errorMessage = '_readEmail(): Error - name cannot be empty in emailData!';
      var emailData = { label: 0 };

      spamDetector._readEmail('path', emailData).catch(function (error) {
        return (0, _chai.expect)(error).to.throw(errorMessage);
      });
    });

    it('label is missing', function () {
      var errorMessage = '_readEmail(): Error - label cannot be empty in emailData!';
      var emailData = { name: 'file.txt' };

      spamDetector._readEmail('path', emailData).catch(function (error) {
        return (0, _chai.expect)(error).to.throw(errorMessage);
      });
    });

    it('proper email. relative path', function () {
      var emailData = { name: 'test-email-proper.txt', label: 1 };

      return spamDetector._readEmail('../test/testEmails', emailData).then(function (result) {
        return (0, _chai.expect)(result).to.deep.equal({ label: 1, text: 'My test email.' });
      });
    });

    it('proper email. absolute path', function () {
      var requireStub = (0, _proxyquire2.default)('../dist/spamDetector.js', {
        fs: {
          createReadStream: function createReadStream(path) {
            (0, _chai.expect)(path).to.equal(_isWindows2.default ? '\\opt\\test-email-proper.txt' : '/opt/test-email-proper.txt');
          }
        }
      });

      var SpamDetector = requireStub.default;
      var spamDetector = new SpamDetector();

      var emailData = { name: 'test-email-proper.txt', label: 1 };
      return spamDetector._readEmail('/opt/', emailData).catch(function (error) {
        return (0, _chai.expect)(error.toString()).to.equal("TypeError: Cannot read property 'pipe' of undefined");
      });
    });
  });
});