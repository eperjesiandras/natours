/* eslint-disable node/no-unsupported-features/es-syntax */
const AppError = require("../utils/appError");
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const handleDuplicateFieldsDB = (err) => {
  /*https://stackoverflow.com/questions/171480/regex-grabbing-values-between-quotation-marks*/
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0]; /*is in the first line of the error array*/
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  /*it maps and extracts the relevant error messages from the error prompt. Can check in dev mode*/

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const handleJWTError = () => new AppError("Invalid token. Please log in", 401);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const handleJWTExpiredError = () => new AppError("Token expired. Please log in", 401);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // B) RENDERED WEBSITE
    console.error("ERROR 💥", err);
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const sendErrorProd = (err, req, res) => {
  /*🗃️ A API*/
  if (req.originalUrl.startsWith("/api")) {
    /*⚙️ Operational, trusted error: send message to client*/
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    /*⚙️ Programming or other unknown error: don't leak error details*/
    /*1 Log error*/
    console.error("ERROR 💥", err);
    /*2 Send generic message*/
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
  /*🗃️ B RENDERED WEBSITE*/
  /*⚙️ Operational, trusted error: send message to client*/
  if (err.isOperational) {
    //console.log(err);
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
  /*⚙️ Programming or other unknown error: don't leak error details*/
  /* 1) Log error*/
  console.error("ERROR 💥", err);
  /* 2) Send generic message*/
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: "Please try again later.",
  });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    /*🖥️TRANSFORM MONGOOSE ERROR TO OPERATIONAL ERROR: */
    //let error = { ...err }; /*hardcopy of err attribute in order to prevent modification*/
    /*not working*/
    let error;
    error.message = err.message;
    if (err.name === "CastError") err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === "ValidationError") err = handleValidationErrorDB(err);
    if (err.name === "JsonWebTokenError") err = handleJWTError();
    if (err.name === "TokenExpiredError") err = handleJWTExpiredError();

    sendErrorProd(err, req, res);
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
