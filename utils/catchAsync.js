module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
/*dont forget that in order to use catchasync, you always should define req, res and next too*/
