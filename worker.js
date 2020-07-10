process.on('message', ({ regExp, flags, string }) => {
  const r = new RegExp(regExp, flags);
  process.send({
    result: string.match(r)
  });
});
