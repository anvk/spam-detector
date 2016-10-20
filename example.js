'use strict';

/* global require */

var SpamDetector = require('./dist/spam-detector.js').default;
var emailsData = require('./emails/emailsData.json');
var emailsData_test = require('./emails/emailsData_test.json');

var spamDetector = new SpamDetector({
  trainPath: './emails/train',
  testPath: './emails/test',
  emailsData: emailsData_test
});

spamDetector.train();
