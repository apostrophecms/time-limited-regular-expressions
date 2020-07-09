const cp = require('child_process');

module.exports = ({ limit = 0.25 } = {}) => {
  let worker = null;
  let working = false;
  const queue = [];
  process.on('exit', cleanup);
  return {
    match(regExp, string) {
      return new Promise((resolve, reject) => {
        if (!worker) {
          worker = createWorker();
        }
        queue.push({
          regExp,
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

