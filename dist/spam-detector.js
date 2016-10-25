'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mailparser = require('mailparser');

var _natural = require('natural');

var _natural2 = _interopRequireDefault(_natural);

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

require('babel-polyfill');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BACK_SLASH = '/';
var MILLISECONDS = 1000;

var MAX_WORD_FEATURES = 5000;

var EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
var URL_REGEX = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
var HTML_REGEX = /<[^<>]+>/;
var NUMBER_REGEX = /\d+/;
var DOLLAR_REGEX = /\$\d+(,\d+)*(?:\.\d+)?/g;
var ALPHA_NUMERIC_REGEX = /[^\w\s]|_/g;
var PUNCTUATION_REGEX = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
var SINGLE_SPACE_REGEX = /\s+/g;

// extend String methods
_natural2.default.PorterStemmer.attach();

var SpamDetector = function () {
  function SpamDetector() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultOptions;

    _classCallCheck(this, SpamDetector);

    var trainPath = options.trainPath;
    var testPath = options.testPath;
    var emailsData = options.emailsData;
    var trainData = emailsData.trainData;
    var testData = emailsData.testData;


    this.featuresTrain = [];
    this.labelsTrain = [];
    this.trainData = trainData;
    this.testPath = testPath;
    this.testData = testData;
    this.trainPath = this._appendSlash(trainPath);
    this.bagOfWords = new Map();
  }

  _createClass(SpamDetector, [{
    key: 'train',
    value: function train() {
      var _this = this;

      var startTime = new Date();
      var taskTime = startTime;
      console.log('Training starts...');

      console.log('Reading files starts...');

      this._readEmails(this.trainData).then(function (results) {
        console.log('Results are ' + JSON.stringify(results[0]));

        var duration = (Date.now() - taskTime) / MILLISECONDS;
        console.log('Reading files finished. Execution time: ' + duration + ' seconds');

        taskTime = new Date();
        return _this._preprocessEmails(results);
      }).then(function (results) {
        console.log('Results are ' + JSON.stringify(results[0]));

        var duration = (Date.now() - taskTime) / MILLISECONDS;
        console.log('Email preprocess finished. Execution time: ' + duration + ' seconds');

        _this.bagOfWords = _this._generateBagOfWords(results);

        return _this._vectorize(results, _this.bagOfWords);
      }).then(function (results) {
        console.log('Results are ' + JSON.stringify(results[0]));
      }).catch(function (error) {
        console.error(error);
        throw error;
      });
    }
  }, {
    key: '_appendSlash',
    value: function _appendSlash(path) {
      return path.substr(-1) === BACK_SLASH ? path : '' + path + BACK_SLASH;
    }
  }, {
    key: '_vectorize',
    value: function _vectorize() {
      var tokenizedEmails = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var bagOfWords = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var idfs = this._computeIdfs(tokenizedEmails, bagOfWords);

      var result = [];

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = tokenizedEmails[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _tokenizedEmail = _step.value;
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

      console.log(result);

      return result;
    }
  }, {
    key: '_computeTfs',
    value: function _computeTfs() {
      var tokenizedEmailText = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var bagOfWords = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var wordsMap = new Map(bagOfWords.map(function (element) {
        return [element, 0];
      }));
      var numberOfWords = tokenizedEmail.length;

      for (var word in tokenizedEmailText) {
        if (!wordsMap.has(word)) {
          continue;
        }

        wordsMap.set(word, wordsMap.get(token) + 1);
      }

      return wordsMap;
    }
  }, {
    key: '_computeIdfs',
    value: function _computeIdfs() {
      var tokenizedEmails = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var bagOfWords = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var wordsMap = new Map();
      var numOfDocuments = tokenizedEmails.length;
      console.log(numOfDocuments);

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = bagOfWords[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var word = _step2.value;

          wordsMap.set(word, 0);
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = tokenizedEmails[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _tokenizedEmail2 = _step3.value;

              var tokenizedEmailTextSet = new Set(_tokenizedEmail2.text);

              if (tokenizedEmailTextSet.has(word)) {
                wordsMap.set(word, wordsMap.get(word) + 1);
                continue;
              }
            }

            // we computed occurence of the word in documents.
            // let's set its Idf now
            // Idf = log(Number of documents / Number of documents that contain word w)
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }

          wordsMap.set(word, Math.log(numOfDocuments / wordsMap.get(word)));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      console.log('my idf array');
      console.log(wordsMap);

      return wordsMap;
    }
  }, {
    key: '_generateBagOfWords',
    value: function _generateBagOfWords() {
      var tokenizedEmails = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var bagOfWords = new Map();

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = tokenizedEmails[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _tokenizedEmail3 = _step4.value;
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = _tokenizedEmail3.text[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var _token = _step5.value;

              bagOfWords.set(_token, bagOfWords.has(_token) ? bagOfWords.get(_token) + 1 : 1);
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }
        }

        // Pick only MAX_WORD_FEATURES number of most frequent words in the
        // set of our documents. Infrequent words can cause our model to overfit
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var sortedArray = [].concat(_toConsumableArray(bagOfWords.entries())).sort(function (a, b) {
        return a[1] > b[1] ? -1 : 1;
      }).slice(0, MAX_WORD_FEATURES);

      console.log(sortedArray);

      // return just words in a sorted order
      return sortedArray.map(function (element) {
        return element[0];
      }).sort();
    }
  }, {
    key: '_preprocessEmails',
    value: function _preprocessEmails() {
      var _this2 = this;

      var emails = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      return new _promise2.default(function (resolve, reject) {
        try {
          var results = emails.map(function (email) {
            return _extends({}, email, {
              text: _this2._preprocessEmailText(email.text)
            });
          });

          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
    }
  }, {
    key: '_preprocessEmailText',
    value: function _preprocessEmailText(text) {
      if (typeof text !== 'string') {
        return [];
      }

      var result = text;

      // Preprocess step #1: Lower case
      result = result.toLowerCase();

      // Preprocess step #2: Strip all HTML
      result = result.replace(HTML_REGEX, ' ');

      // Preprocess step #3: Handle URLs
      result = result.replace(URL_REGEX, 'httpaddr');

      // Preprocess step #4: Handle Email addresses
      result = result.replace(EMAIL_REGEX, 'emailaddr');

      // Preprocess step #5: Handle $ sign
      result = result.replace(DOLLAR_REGEX, 'dollar');

      // Preprocess step #6: Remove punctuation
      result = result.replace(ALPHA_NUMERIC_REGEX, ' ');

      // Preprocess step #7: Replace characters between 0-9
      result = result.replace(NUMBER_REGEX, 'number');

      // Preprocess step #8: Remove extra spaces
      result = result.replace(SINGLE_SPACE_REGEX, ' ');

      // Preprocess step #9: Stem the words
      result = result.tokenizeAndStem();

      return result;
    }
  }, {
    key: '_readEmails',
    value: function _readEmails() {
      var _this3 = this;

      var emailsData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var promises = emailsData.map(function (emailData) {
        return _this3._readEmail(emailData);
      });

      return _promise2.default.all(promises);
    }
  }, {
    key: '_readEmail',
    value: function _readEmail() {
      var _this4 = this;

      var emailData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return new _promise2.default(function (resolve, reject) {
        var mailparser = new _mailparser.MailParser();

        var name = emailData.name;
        var classifier = emailData.classifier;


        mailparser.on('end', function (mailObj) {
          console.log(mailObj.text);

          resolve({
            subject: mailObj.subject,
            text: mailObj.text,
            classifier: classifier
          });
        });

        _fs2.default.createReadStream('' + _this4.trainPath + name).pipe(mailparser);
      });
    }
  }]);

  return SpamDetector;
}();

exports.default = SpamDetector;