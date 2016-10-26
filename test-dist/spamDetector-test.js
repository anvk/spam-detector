'use strict';

var _chai = require('chai');

var _spamDetector = require('../dist/spamDetector.js');

var _spamDetector2 = _interopRequireDefault(_spamDetector);

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

  it('_appendSlash tests', function () {
    var tests = [{ input: undefined, output: '/' }, { input: '', output: '/' }, { input: 'some', output: 'some/' }, { input: 'some/', output: 'some/' }, { input: 'some/some//', output: 'some/some//' }];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = tests[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var test = _step.value;

        (0, _chai.expect)(spamDetector._appendSlash(test.input)).to.equal(test.output);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
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

    it('bowLength is below 1', function () {
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

    it.only('Proper execution. Get only first 4 common words', function () {
      var result = spamDetector._generateBagOfWords(sampleTokenizedEmails, 4);

      (0, _chai.expect)(result).to.deep.equal(['three_A', 'three_B', 'two_A', 'two_B']);
    });
  });
});