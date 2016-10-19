import { MailParser } from 'mailparser';
import Promise from 'promise';
import fs from 'fs';

const BACK_SLASH = '/';
const MILLISECONDS = 1000;

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
  }

  train() {
    const startTime = new Date();
    console.log('Training starts...');

    this._readEmails(this.trainData).then(() => {
      const duration = (Date.now() - startTime) / MILLISECONDS;
      console.log(`Training finished. Execution time: ${duration} seconds`);
    });
  }

  _appendSlash(path) {
    return path.substr(-1) === BACK_SLASH
      ? path
      : `${path}${BACK_SLASH}`;
  }

  _readEmail(emailData) {
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

  _readEmails(emailsData) {
    const startTime = new Date();
    console.log('Reading files starts...');

    const promises = emailsData.map(emailData => this._readEmail(emailData));

    return Promise.all(promises)
      .then(results => {
        console.log(`Results are ${JSON.stringify(results)}`);

        const duration = (Date.now() - startTime) / MILLISECONDS;
        console.log(`Reading files finished. Execution time: ${duration} seconds`);
      });
  }
}
