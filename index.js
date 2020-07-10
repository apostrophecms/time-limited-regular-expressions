const cp = require('child_process');

module.exports = ({ limit = 0.25 } = {}) => {
  let worker = null;
  let working = false;
  const queue = [];
  process.on('exit', cleanup);
  return {
    match(regExp, string) {
      let flags;
      regExp = regExp.toString();
      // A regexp literal was typically passed and when it went through toString,
      // it became /regexp-goes-here/flags-go-here. Parse that into a form we
      // can feed to the RegExp constructor in the other process
      const matches = regExp.match(/^\/(.*?)\/([a-z]*)$/);
      if (matches) {
        regExp = matches[1];
        flags = matches[2];
      }
      return new Promise((resolve, reject) => {
        if (!worker) {
          worker = createWorker();
        }
        queue.push({
          regExp,
          flags,
          string,
          resolve,
          reject
        });
        if (!working) {
          one();
        }
        function createWorker() {
          const worker = cp.fork(`${__dirname}/worker.js`, {
            stdio: 'inherit' // TODO back to ignore
          });
          // So the parent process can exit due to a lack of work to do,
          // without explicitly closing the child
          worker.unref();
          worker.channel.unref();
          return worker;
        }
        function one() {
          let settled = false;
          if (!queue.length) {
            return;
          }
          working = true;
          const { regExp, string, resolve, reject } = queue.shift();
          worker.once('message', receive);
          const timeout = setTimeout(function() {
            if (!settled) {
              worker.kill();
              worker = createWorker();
              const error = new Error(`A user-supplied regular expression took more than ${limit} seconds to evaluate.`);
              error.name = 'timeout';
              reject(error);
              settled = true;
              working = false;
              one();
            }
          }, limit * 1000);
          worker.send({
            regExp,
            flags,
            string
          });
          function receive(message) {
            clearTimeout(timeout);
            if (!settled) {
              settled = true;
              working = false;
              resolve(message.result);
              one();
            }
          }
        }
      });
    }
  };
  function cleanup() {
    if (worker) {
      worker.kill();
    }
  }
};

