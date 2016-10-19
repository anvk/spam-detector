'use strict';

/* global require */

var SpamDetector = require('./dist/spam-detector.js').default;
var emailsData = require('./emails/emailsData.json');

var spamDetector = new SpamDetector({
  trainPath: './emails/train',
  testPath: './emails/test',
  emailsData: emailsData
});

spamDetector.train();
