// Set a 1-second limit. Default is 0.25 seconds
const regExp = require('./index.js')({ limit: 1 });

// Email address validator with potentially evil characteristics
// (catastrophic backtracking)
const evil = '^([a-zA-Z0-9])(([\-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}[a-z0-9]+[.]{1}(([a-z]{2,3})|([a-z]{2,3}[.]{1}[a-z]{2,3}))$';

(async () => {
  // Run a potentially slow regular expression on short, matching input
  const realEmail = 'test@test.com';
  const realEmailResult = await regExp.match(evil, realEmail);
  // Normal behavior, may be truthy or falsy according to match,
  // returns the same array result as regular regexp match() calls
  console.log(realEmailResult);
  const evilEmail = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  try {
    const evilEmailResult = await regExp.match(evil, evilEmail);
    // We will not get here, exception will be thrown
  } catch (e) {
    console.log(e.name); // Will be 'evilRegExp'
  }
})();
