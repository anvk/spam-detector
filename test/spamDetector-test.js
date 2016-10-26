/* global it, describe, before, after */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

import { expect } from 'chai';
import SpamDetector from '../dist/spamDetector.js';

describe('spam-detector tests', () => {
  let spamDetector;

  before(() => spamDetector = new SpamDetector());

  after(() => spamDetector = undefined);

  it('_appendSlash tests', () => {
    const tests = [
      { input: undefined, output: '/' },
      { input: '', output: '/' },
      { input: 'some', output: 'some/' },
      { input: 'some/', output: 'some/' },
      { input: 'some/some//', output: 'some/some//' }
    ];

    for (const test of tests) {
      expect(spamDetector._appendSlash(test.input)).to.equal(test.output);
    }
  });

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

    it('bowLength is below 1', () => {
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
});
