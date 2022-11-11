/* eslint-disable prettier/prettier */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️HANDLE UNCAUGHT EXCEPTIONS*/
/*all errors not handled anywhere else in the code
  should be on top of file in order to securely catch ALL unhandled errors or bugs*/
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
mongoose
  /*💾MONGOOSE CONNECT PORMISE for local DB - see notes.md, in config.env: DATABASE_LOCAL=mongodb://localhost:27017/natours*/
  /*.connect(process.env.DATABASE_LOCAL, {*/
  /*💾MONGOOSE CONNECT PORMISE for hosted DB*/
  .connect(DB, {
    useNewUrlParser: true,
    //useCreateIndex: true,     - NOT WORKING
    //useFindAndModify: false,  - NOT WORKING
    /*deprecation warnings*/
    /*DeprecationWarning errors are logged by the Node.js runtime when your code (or one of the dependencies in your code) calls a deprecated API. These warnings usually include a DEP deprecation code. They are logged using console.error and end up in your CloudWatch logs. You can view a full list over on the Node.js docs. Even though these are logged as errors, they are really just warnings. This warning might be either printed out by a dependency, or by the Node.js runtime. In either case, make sure you are not calling a deprecated Node.js API, and make sure to keep your dependencies up to date. If you are using Issues, Seed will automatically ignore these warnings.*/
  })
  .then((/*con*/) => {
    //console.log(con.connections);
    console.log("DB connection is succesful");
  });

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️ENVIROMENT VARIABLES*/
//console.log(app.get("env")); /*development*/
// console.log(process.env); /*tons of ENV VARIABLES, coming from the process core module*/

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App runing on port ${port}...`);
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️HANDLE UNHANDLED REJECTIONS*/

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
  /*with this the server has time to close all processes before shutting down*/
});
/*Node normally exits with a 0 status code when no more async operations are pending.
1 - Uncaught Fatal Exception: There was an uncaught exception, and it was not handled by a domain or an uncaughtException event handler.
2 - Unused: Reserved by Bash for built in misuse.
3 - Internal JavaScript Parse Error: The JavaScript source code internal in Node's bootstrapping process caused a parse error. This is extremely rare, and generally can only happen during the development of Node itself.
4 - Internal JavaScript Evaluation Failure: The JavaScript source code internal in Node's bootstrapping process failed to return a function value when evaluated. This is extremely rare, and generally can only happen during the development of Node itself.
5 - Fatal Error: There was a fatal unrecoverable error in V8. Typically, a message will be printed to stderr with the prefix FATAL ERROR.
6 - Non-function Internal Exception Handler: There was an uncaught exception, but the internal fatal exception handler function was somehow set to a non-function, and could not be called.
7 - Internal Exception Handler Run-Time Failure: There was an uncaught exception, and the internal fatal exception handler function itself threw an error while attempting to handle it.
8 - Unused
9 - Invalid Argument: Either an unknown option was specified, or an option requiring a value was provided without a value.
10 - Internal JavaScript Run-Time Failure: The JavaScript source code internal in Node's bootstrapping process threw an error when the bootstrapping function was called. This is extremely rare, and generally can only happen during the development of Node itself.
11 - Invalid Debug Argument: The --debug and/or --debug-brk options were set, but an invalid port number was chosen
>128 - Signal Exits: If Node receives a fatal signal such as SIGKILL or SIGHUP, then its exit code will be 128 plus the value of the signal code. This is a standard Unix practice, since exit codes are defined to be 7-bit integers, and signal exits set the high-order bit, and then contain the value of the signal code.*/

process.on("SIGTERM", () => {
  console.log(" 😴 SIGTERM received. Shutting down gracefully");
  server.close(() => {
    console.log("🔔 Process terminated");
  });
});
