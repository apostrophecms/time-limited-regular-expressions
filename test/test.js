const assert = require('assert');
const regExp = require('../index.js')({ limit: 0.25 });
// Email address validator with evil characteristics (catastrophic backtracking)
const evil = /^([a-zA-Z0-9])(([\-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}[a-z0-9]+[.]{1}(([a-z]{2,3})|([a-z]{2,3}[.]{1}[a-z]{2,3}))$/;

describe('time limited regular expressions', () => {
  it('should process a matching regular expression', async () => {
    const result = await regExp.match(/^foo$/, 'foo');
    assert(result);
  });
  it('should process a nonmatching regular expression', async () => {
    const result = await regExp.match(/^foo$/, 'foo ');
    assert(!result);
  });
  it('should support the global flag', async () => {
    const result = await regExp.match(/foo/g, 'foo bfoo wafoogle wafoom');
    assert(result.length === 4);
    for (const r of result) {
      assert(r === 'foo');
    }
  });
  it('should run a problematic regular expression on short nonmatching input', async () => {
    const userDefinedEmail = 'AA';
    const isValid = await regExp.match(evil, userDefinedEmail);
    assert(!isValid);
  });
  it('should run a problematic regular expression on short matching input', async () => {
    const userDefinedEmail = 'test@test.com';
    const isValid = await regExp.match(evil, userDefinedEmail);
    assert(isValid);
  });
  it('should flunk a problematic regular expression on long input', async () => {
    const userDefinedEmail = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    try {
      const isValid = await regExp.match(evil, userDefinedEmail);
      // We should not get here at all, we should throw an timeout error
      assert(false);
    } catch (e) {
      assert(e.name === 'timeout');
    }
  });
  it('should run the problematic regular expression again on short input', async () => {
    const userDefinedEmail = 'AA';
    const isValid = await regExp.match(evil, userDefinedEmail);
    assert(!isValid);
  });
  it('should resolve four concurrent requests for a reasonable regular expression', async () => {
    const names = [ 'Bob', 'Jane', 'Sue', 'George' ];
    const results = await Promise.all(names.map(name => regExp.match(/^\\w+$/, name)));
    assert(results.length === 4);
    assert(!results.find(result => !result));
  });
});
