function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

module.exports = { delay };