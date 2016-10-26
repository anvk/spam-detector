import { MailParser } from 'mailparser';
import natural from 'natural';
import Promise from 'promise';
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
  constructor(options = {}) {
    const {
      trainPath = '',
      testPath = '',
      emailsData = {},
      bowLength = MAX_WORD_FEATURES
    } = options;

    const { trainData, testData } = emailsData;

    this.featuresTrain = [];
    this.labelsTrain = [];
    this.trainData = trainData;
    this.testPath = testPath;
    this.testData = testData;
    this.bowLength = bowLength;
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

        this.bagOfWords = this._generateBagOfWords(results, this.bowLength);

        return this._vectorize(results, this.bagOfWords);
      })
      .then((results) => {
        console.log(`Results are ${JSON.stringify(results[0])}`);
      })
      .catch(error => {
        console.error(error);
        throw error;
      });
  }

  _appendSlash(path = '') {
    return path.substr(-1) === BACK_SLASH
      ? path
      : `${path}${BACK_SLASH}`;
  }

  _vectorize(tokenizedEmails = [], bagOfWords = []) {
    if (!bagOfWords.length) {
      throw '_vectorize(): Error - bagOfWords cannot be empty!';
    }

    if (!tokenizedEmails.length) {
      throw '_vectorize(): Error - tokenizedEmails cannot be empty!';
    }

    const idfs = this._computeIdfs(tokenizedEmails, bagOfWords);

    let result = [];

    for (let tokenizedEmail of tokenizedEmails) {
      tokenizedEmail = tokenizedEmail || {};
      if (!tokenizedEmail.text) {
        throw '_vectorize(): Error - tokenizedEmail is missing text property!';
      }

      console.log(tokenizedEmail);
      const tfs = this._computeTfs(tokenizedEmail.text, bagOfWords);

      console.log('so tfs and idfs are:');
      console.log(idfs);
      console.log(tfs);

      const vectorizedEmail = new Map();
      idfs.forEach((idf, word) =>
        vectorizedEmail.set(word, idf * tfs.get(word))
      );

      result.push(vectorizedEmail);
    }

    console.log('Result of vectorize');
    console.log(result);

    return result;
  }

  _computeTfs(tokenizedEmailText = [], bagOfWords = []) {
    if (!bagOfWords.length) {
      throw '_computeTfs(): Error - bagOfWords cannot be empty!';
    }

    if (!tokenizedEmailText.length) {
      throw '_computeTfs(): Error - email with empty body was passed!';
    }

    let wordsMap = new Map(bagOfWords.map(element => [element, 0]));
    const numberOfWords = tokenizedEmailText.length;

    for (const word of tokenizedEmailText) {
      if (!wordsMap.has(word)) {
        continue;
      }

      wordsMap.set(word, wordsMap.get(word) + 1);
    }

    wordsMap.forEach((count, word) =>
      wordsMap.set(word, count / numberOfWords)
    );

    return wordsMap;
  }

  _computeIdfs(tokenizedEmails = [], bagOfWords = []) {
    if (!bagOfWords.length) {
      throw '_computeIdfs(): Error - bagOfWords cannot be empty!';
    }

    if (!tokenizedEmails.length) {
      throw '_computeIdfs(): Error - tokenizedEmails cannot be empty!';
    }

    let wordsMap = new Map();
    let numOfDocuments = tokenizedEmails.length;

    for (const word of bagOfWords) {
      wordsMap.set(word, 0);
      for (let tokenizedEmail of tokenizedEmails) {
        tokenizedEmail = tokenizedEmail || {};
        if (!tokenizedEmail.text) {
          throw '_computeIdfs(): Error - tokenizedEmail is missing text property!';
        }

        const tokenizedEmailTextSet = new Set(tokenizedEmail.text);

        if (tokenizedEmailTextSet.has(word)) {
          wordsMap.set(word, wordsMap.get(word) + 1);
          continue;
        }
      }

      // we computed occurence of the word in documents.
      // let's set its Idf now
      // Idf = log(Number of documents / Number of documents that contain word w)
      wordsMap.set(word, Math.log(numOfDocuments / wordsMap.get(word)));
    }

    return wordsMap;
  }

  _generateBagOfWords(tokenizedEmails = [], bowLength = MAX_WORD_FEATURES) {
    if (bowLength < 1) {
      throw '_generateBagOfWords(): Error - Bag of Words must have at least 1 word';
    }

    if (!tokenizedEmails.length) {
      throw '_generateBagOfWords(): Error - tokenizedEmails cannot be empty!';
    }

    let bagOfWords = new Map();

    for (let tokenizedEmail of tokenizedEmails) {
      tokenizedEmail = tokenizedEmail || {};
      if (!tokenizedEmail.text) {
        throw '_generateBagOfWords(): Error - tokenizedEmail is missing text property!';
      }

      for (const token of tokenizedEmail.text) {
        bagOfWords.set(token, bagOfWords.has(token)
         ? bagOfWords.get(token) + 1
         : 1
        );
      }
    }

    // Pick only bowLength number of most frequent words in the set
    // of our documents. Infrequent words can cause our model to overfit.
    const sortedArray = [...bagOfWords.entries()]
      .sort((a, b) => {
        return a[1] > b[1] ? -1 : 1;
      })
      .slice(0, bowLength);

    // return just words in a sorted order
    return sortedArray.map(element => element[0]).sort();
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
        console.log(mailObj.text);

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
