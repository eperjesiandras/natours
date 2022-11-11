/* eslint-disable prettier/prettier */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"; /*500 is error*/
    this.isOperational = true; /*only for operational errors*/

    Error.captureStackTrace(this, this.constructor); /*to catch error location*/
    /*Error.captureStackTrace(targetObject[, constructorOpt])
    Creates a .stack property on targetObject, which when accessed returns a string representing the location in the code at which Error.captureStackTrace() was called. The constructorOpt argument is useful for hiding implementation details of error generation from the user*/
  }
}

module.exports = AppError;
