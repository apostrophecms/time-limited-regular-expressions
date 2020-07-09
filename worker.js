process.on('message', ({ regExp, string }) => {
  const r = new RegExp(regExp);
  process.send({
    result: string.match(r)
  });
});
