import { MailParser } from 'mailparser';
import natural from 'natural';
import Promise from 'promise';
import 'babel-polyfill';
import fs from 'fs';

const BACK_SLASH = '/';
const MILLISECONDS = 1000;

const MAX_WORD_FEATURES = 5000;

const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
const URL_REGEX = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
const HTML_REGEX = /<[^<>]+>/;
const NUMBER_REGEX = /\d+/;
const DOLLAR_REGEX = /\$\d+(,\d+)*(?:\.\d+)?/g;
const ALPHA_NUMERIC_REGEX = /[^\w\s]|_/g;
const PUNCTUATION_REGEX = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
const SINGLE_SPACE_REGEX = /\s+/g;

// extend String methods
natural.PorterStemmer.attach();

export default class SpamDetector {
  constructor(options = defaultOptions) {
    const {
      trainPath,
      testPath,
      emailsData
    } = options;

    const { trainData, testData } = emailsData;

    this.featuresTrain = [];
    this.labelsTrain = [];
    this.trainData = trainData;
    this.testPath = testPath;
    this.testData = testData;
    this.trainPath = this._appendSlash(trainPath);
    this.bagOfWords = new Map();
  }

  train() {
    const startTime = new Date();
    let taskTime = startTime;
    console.log('Training starts...');

    console.log('Reading files starts...');

    this._readEmails(this.trainData)
      .then((results) => {
        console.log(`Results are ${JSON.stringify(results[0])}`);

        const duration = (Date.now() - taskTime) / MILLISECONDS;
        console.log(`Reading files finished. Execution time: ${duration} seconds`);

        taskTime = new Date();
        return this._preprocessEmails(results);
      })
      .then((results) => {
        console.log(`Results are ${JSON.stringify(results[0])}`);

        const duration = (Date.now() - taskTime) / MILLISECONDS;
        console.log(`Email preprocess finished. Execution time: ${duration} seconds`);

        this._generateBagOfWords(results);

        return this._vectorize(results);
      })
      .then((results) => {
        console.log(`Results are ${JSON.stringify(results[0])}`);
      })
      .catch(error => {
        throw error;
      });
  }

  _appendSlash(path) {
    return path.substr(-1) === BACK_SLASH
      ? path
      : `${path}${BACK_SLASH}`;
  }

  _vectorize(tokenizedEmails = []) {
    return tokenizedEmails;
  }

  _generateBagOfWords(tokenizedEmails = []) {
    let bagOfWords = new Map();

    for (const tokenizedEmail of tokenizedEmails) {
      for (const token of tokenizedEmail.text) {
        bagOfWords.set(token, bagOfWords.has(token)
         ? bagOfWords.get(token) + 1
         : 1
        );
      }
    }

    const sortedArray = [...bagOfWords.entries()]
      .sort((a, b) => {
        return a[1] > b[1] ? -1 : 1;
      })
      .slice(0, MAX_WORD_FEATURES);

    sortedArray.forEach((element, index) => {
      this.bagOfWords.set(element[0], index + 1)
    });
  }

  _preprocessEmails(emails = []) {
    return new Promise((resolve, reject) => {
      try {
        const results = emails.map(email => ({
          ...email,
          text: this._preprocessEmailText(email.text)
        }));

        resolve(results);
      } catch(error) {
        reject(error);
      }
    });
  }

  _preprocessEmailText(text) {
    if (typeof text !== 'string') {
      return [];
    }

    let result = text;

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

  _readEmails(emailsData = []) {
    const promises = emailsData.map(emailData => this._readEmail(emailData));

    return Promise.all(promises);
  }

  _readEmail(emailData = {}) {
    return new Promise((resolve, reject) => {
      const mailparser = new MailParser();

      const { name, classifier } = emailData;

      mailparser.on('end', (mailObj) => {
        resolve({
          subject: mailObj.subject,
          text: mailObj.text,
          classifier
        });
      });

      fs.createReadStream(`${this.trainPath}${name}`)
        .pipe(mailparser);
    });
  }
}
