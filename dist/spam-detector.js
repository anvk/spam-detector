'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mailparser = require('mailparser');

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BACK_SLASH = '/';
var MILLISECONDS = 1000;

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
  }

  _createClass(SpamDetector, [{
    key: 'train',
    value: function train() {
      var startTime = new Date();
      console.log('Training starts...');

      this._readEmails(this.trainData).then(function () {
        var duration = (Date.now() - startTime) / MILLISECONDS;
        console.log('Training finished. Execution time: ' + duration + ' seconds');
      });
    }
  }, {
    key: '_appendSlash',
    value: function _appendSlash(path) {
      return path.substr(-1) === BACK_SLASH ? path : '' + path + BACK_SLASH;
    }
  }, {
    key: '_readEmail',
    value: function _readEmail(emailData) {
      var _this = this;

      return new _promise2.default(function (resolve, reject) {
        var mailparser = new _mailparser.MailParser();

        var name = emailData.name;
        var classifier = emailData.classifier;


        mailparser.on('end', function (mailObj) {
          console.log('Subject: ' + mailObj.subject);
          //console.log(mailObj);

          resolve({
            subject: mailObj.subject,
            text: mailObj.text,
            classifier: classifier
          });

          //this.featuresTrain.push(mailObj.subject);
          //this.labelsTrain.push(classifier);
        });

        _fs2.default.createReadStream('' + _this.trainPath + name).pipe(mailparser);
      });
    }
  }, {
    key: '_readEmails',
    value: function _readEmails(emailsData) {
      var _this2 = this;

      var startTime = new Date();
      console.log('Reading files starts...');

      var promises = emailsData.map(function (emailData) {
        return _this2._readEmail(emailData);
      });

      return _promise2.default.all(promises).then(function (results) {
        console.log('Results are ' + JSON.stringify(results));

        var duration = (Date.now() - startTime) / MILLISECONDS;
        console.log('Reading files finished. Execution time: ' + duration + ' seconds');
      });
    }
  }]);

  return SpamDetector;
}();

exports.default = SpamDetector;