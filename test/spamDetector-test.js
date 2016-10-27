/* global it, describe, before, after */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

import { expect } from 'chai';
import SpamDetector from '../dist/spamDetector.js';
import proxyquire from 'proxyquire';
import isWindows from 'is-windows';

describe('spam-detector tests', () => {
  let spamDetector;

  before(() => spamDetector = new SpamDetector());

  after(() => spamDetector = undefined);

  describe('_computeTfs tests', () => {
    const sampleWords = ['cat', 'catch', 'grey', 'mouse'];
    const sampleBagOfWords = ['cat', 'mouse'];
    const wordCount = sampleWords.length;

    it('empty tokenizedEmailText', () => {
      const errorMessage = '_computeTfs(): Error - email with empty body was passed!';

      expect(() => spamDetector._computeTfs(undefined, sampleBagOfWords))
        .to.throw(errorMessage);
    });

    it('empty bagOfWords', () => {
      const errorMessage = '_computeTfs(): Error - bagOfWords cannot be empty!';

      expect(() => spamDetector._computeTfs(sampleWords))
        .to.throw(errorMessage);
    });

    it('example 1. some words not in bagOfWords', () => {
      const tf = 1 / wordCount;

      const resultMap = spamDetector._computeTfs(sampleWords, sampleBagOfWords);
      const resultValues = [...resultMap.values()];

      expect(resultValues).to.deep.equal([tf, tf]);
    });

    it('example 2. some words appear more than once', () => {
      const sampleWords = ['cat', 'catch', 'grey', 'mouse', 'and', 'mouse'];
      const wordCount = sampleWords.length;
      const sampleBagOfWords = ['cat', 'mouse', 'Alex'];

      const resultMap = spamDetector._computeTfs(sampleWords, sampleBagOfWords);
      const resultValues = [...resultMap.values()];

      expect(resultValues).to.deep.equal([1 / wordCount, 2 / wordCount, 0]);
    });
  });

  describe('_computeIdfs tests', () => {
    const sampleTokenizedEmails = [
      {
        text: ['cat', 'catch', 'grey', 'mouse']
      },
      {
        text: ['cat', 'lick', 'white', 'mouse']
      }
    ];
    const sampleBagOfWords = ['cat', 'catch', 'white', 'mouse'];
    const docCount = sampleTokenizedEmails.length;

    it('empty tokenizedEmails', () => {
      const errorMessage = '_computeIdfs(): Error - tokenizedEmails cannot be empty!';

      expect(() => spamDetector._computeIdfs(undefined, sampleBagOfWords))
        .to.throw(errorMessage);
    });

    it('empty bagOfWords', () => {
      const errorMessage = '_computeIdfs(): Error - bagOfWords cannot be empty!';

      expect(() => spamDetector._computeIdfs(sampleTokenizedEmails))
        .to.throw(errorMessage);
    });

    it('Proper execution', () => {
      const resultMap = spamDetector
        ._computeIdfs(sampleTokenizedEmails, sampleBagOfWords);
      const resultValues = [...resultMap.values()];

      expect(resultValues).to.deep.equal([
        0,
        0.6931471805599453,
        0.6931471805599453,
        0
      ]);
    });

    it('One of the tokenizedEmails is empty OR does not have text property', () => {
      const wrongSampleTokenizedEmails = [
        ...sampleTokenizedEmails,
        {}
      ];

      const errorMessage = '_computeIdfs(): Error - tokenizedEmail is missing text property!';

      expect(() => spamDetector
        ._computeIdfs(wrongSampleTokenizedEmails, sampleBagOfWords))
        .to.throw(errorMessage);
    });
  });

  describe('_generateBagOfWords tests', () => {
    const sampleTokenizedEmails = [
      {
        text: ['three_A', 'three_A', 'three_A', 'three_B']
      },
      {
        text: ['three_B', 'three_B', 'two_A', 'one_A']
      },
      {
        text: ['two_B', 'two_B', 'two_A', 'one_B']
      }
    ];

    it('empty tokenizedEmails', () => {
      const errorMessage = '_generateBagOfWords(): Error - tokenizedEmails cannot be empty!';

      expect(() => spamDetector._generateBagOfWords()).to.throw(errorMessage);
    });

    it('empty bagOfWords', () => {
      const errorMessage = '_generateBagOfWords(): Error - Bag of Words must have at least 1 word';

      expect(() => spamDetector._generateBagOfWords(sampleTokenizedEmails, 0))
        .to.throw(errorMessage);
    });

    it('One of the tokenizedEmails is empty OR does not have text property', () => {
      const wrongSampleTokenizedEmails = [
        ...sampleTokenizedEmails,
        {}
      ];

      const errorMessage = '_generateBagOfWords(): Error - tokenizedEmail is missing text property!';

      expect(() => spamDetector
        ._generateBagOfWords(wrongSampleTokenizedEmails))
        .to.throw(errorMessage);
    });

    it('Proper execution', () => {
      const result = spamDetector._generateBagOfWords(sampleTokenizedEmails);

      expect(result).to.deep.equal([
        'one_A',
        'one_B',
        'three_A',
        'three_B',
        'two_A',
        'two_B'
      ]);
    });

    it('Proper execution. Get only first 4 common words', () => {
      const result = spamDetector._generateBagOfWords(sampleTokenizedEmails, 4);

      expect(result).to.deep.equal([
        'three_A',
        'three_B',
        'two_A',
        'two_B'
      ]);
    });
  });

  describe('_vectorize tests', () => {
    const sampleTokenizedEmails = [
      {
        text: ['the', 'cat', 'sat', 'on', 'my', 'face']
      },
      {
        text: ['the', 'dog', 'sat', 'on', 'my', 'bed']
      }
    ];

    const sampleBagOfWords = [
      'bed',
      'cat',
      'dog',
      'face',
      'my',
      'on',
      'sat',
      'the'
    ];

    it('empty tokenizedEmails', () => {
      const errorMessage = '_vectorize(): Error - tokenizedEmails cannot be empty!';

      expect(() => spamDetector._vectorize(undefined, sampleBagOfWords))
        .to.throw(errorMessage);
    });

    it('bowLength is below 1', () => {
      const errorMessage = '_vectorize(): Error - bagOfWords cannot be empty!';

      expect(() => spamDetector._vectorize(sampleTokenizedEmails, 0))
        .to.throw(errorMessage);
    });

    it('One of the tokenizedEmails is empty OR does not have text property', () => {
      const wrongSampleTokenizedEmails = [
        ...sampleTokenizedEmails,
        {}
      ];

      // since computeIdf is calculated before hand
      const errorMessage = '_computeIdfs(): Error - tokenizedEmail is missing text property!';

      expect(() => spamDetector
        ._vectorize(wrongSampleTokenizedEmails, sampleBagOfWords))
        .to.throw(errorMessage);
    });

    // taken from https://www.youtube.com/watch?v=hXNbFNCgPfY
    it('Proper execution', () => {
      const result = spamDetector
        ._vectorize(sampleTokenizedEmails, sampleBagOfWords);

      const resultArray = [
        [...result[0].entries()],
        [...result[1].entries()]
      ];

      expect(resultArray).to.deep.equal([
        [
          ['bed', 0], ['cat', 0.11552453009332421], ['dog', 0],
          ['face', 0.11552453009332421], ['my', 0], ['on', 0],
          ['sat', 0], ['the', 0]
        ],
        [
          ['bed', 0.11552453009332421], ['cat', 0],
          ['dog', 0.11552453009332421], ['face', 0], ['my', 0], ['on', 0],
          ['sat', 0], ['the', 0]
        ]
      ]);
    });
  });

  // TBD: need more rich tests
  describe('_preprocessEmailText tests', () => {
    it('wrong input', () => {
      const errorMessage = '_preprocessEmailText(): Error - text has to be a string!';

      const testCases = [
        undefined,
        1,
        {},
        [1, 2, 3],
        null,
        () => {}
      ];

      testCases.forEach(testCase =>
        expect(() => spamDetector._preprocessEmailText(testCase))
          .to.throw(errorMessage)
      );
    });

    it('to lower case', () => {
      const testCases = [
        {
          input: 'Hello MistER CaT',
          output: ['hello', 'mister', 'cat']
        }
      ];

      testCases.forEach(testCase =>
        expect(spamDetector._preprocessEmailText(testCase.input))
          .to.deep.equal(testCase.output)
      );
    });

    it('handle url', () => {
      const testCases = [
        {
          input: 'hello mister cat https://github.com/anvk/',
          output: ['hello', 'mister', 'cat', 'httpaddr']
        }
      ];

      testCases.forEach(testCase =>
        expect(spamDetector._preprocessEmailText(testCase.input))
          .to.deep.equal(testCase.output)
      );
    });

    it('handle email address', () => {
      const testCases = [
        {
          input: 'hello mister cat alexey.novak.mail@gmail.com',
          output: ['hello', 'mister', 'cat', 'emailaddr']
        }
      ];

      testCases.forEach(testCase =>
        expect(spamDetector._preprocessEmailText(testCase.input))
          .to.deep.equal(testCase.output)
      );
    });

    it('handle dollar sign', () => {
      const testCases = [
        {
          input: 'hello mister cat $50',
          output: ['hello', 'mister', 'cat', 'dollar']
        }
      ];

      testCases.forEach(testCase =>
        expect(spamDetector._preprocessEmailText(testCase.input))
          .to.deep.equal(testCase.output)
      );
    });

    it('handle punctuation', () => {
      const testCases = [
        {
          input: 'hello mister cat!',
          output: ['hello', 'mister', 'cat']
        }
      ];

      testCases.forEach(testCase =>
        expect(spamDetector._preprocessEmailText(testCase.input))
          .to.deep.equal(testCase.output)
      );
    });

    it('handle numbers', () => {
      const testCases = [
        {
          input: 'hello mister cat 800',
          output: ['hello', 'mister', 'cat', 'number']
        }
      ];

      testCases.forEach(testCase =>
        expect(spamDetector._preprocessEmailText(testCase.input))
          .to.deep.equal(testCase.output)
      );
    });

    it('handle spaces', () => {
      const testCases = [
        {
          input: 'hello    mister       cat',
          output: ['hello', 'mister', 'cat']
        }
      ];

      testCases.forEach(testCase =>
        expect(spamDetector._preprocessEmailText(testCase.input))
          .to.deep.equal(testCase.output)
      );
    });

    it('handle stemming', () => {
      const testCases = [
        {
          input: 'I saw lots of mouses in the attic today',
          output: ['saw', 'lot', 'mous', 'attic', 'todai']
        }
      ];

      testCases.forEach(testCase =>
        expect(spamDetector._preprocessEmailText(testCase.input))
          .to.deep.equal(testCase.output)
      );
    });
  });

  describe('_readEmail tests', () => {
    it('trainPath is missing', () => {
      const errorMessage = '_readEmail(): Error - trainPath cannot be empty!';

      spamDetector._readEmail().catch(error =>
        expect(error).to.throw(errorMessage)
      );
    });

    it('name is missing', () => {
      const errorMessage = '_readEmail(): Error - name cannot be empty in emailData!';
      const emailData = { label: 0 };

      spamDetector._readEmail('path', emailData).catch(error =>
        expect(error).to.throw(errorMessage)
      );
    });

    it('label is missing', () => {
      const errorMessage = '_readEmail(): Error - label cannot be empty in emailData!';
      const emailData = { name: 'file.txt' };

      spamDetector._readEmail('path', emailData).catch(error =>
        expect(error).to.throw(errorMessage)
      );
    });

    it('proper email. relative path', () => {
      const emailData = { name: 'test-email-proper.txt', label: 1 };

      return spamDetector._readEmail('../test/testEmails', emailData)
        .then(result =>
          expect(result).to.deep.equal({ label: 1, text: 'My test email.' })
        );
    });

    it('proper email. absolute path', () => {
      const requireStub = proxyquire(
        '../dist/spamDetector.js',
        {
          fs: {
            createReadStream(path) {
              expect(path).to.equal(isWindows
                ? '\\opt\\test-email-proper.txt'
                : '/opt/test-email-proper.txt'
              );
            }
          }
        }
      );

      const SpamDetector = requireStub.default;
      const spamDetector = new SpamDetector();

      const emailData = { name: 'test-email-proper.txt', label: 1 };
      return spamDetector._readEmail('/opt/', emailData)
        .catch(error => expect(error.toString())
          .to.equal("TypeError: Cannot read property 'pipe' of undefined")
        );
    });
  });
});
