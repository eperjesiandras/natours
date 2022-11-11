/*💥RUN THIS FROM COMMAND LINE: 
node import-dev-data.js --import
node import-dev-data.js --delete
💥*/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./models/tourModel");
const User = require("./models/userModel");
const Review = require("./models/reviewModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("DB connection is succesful");
  });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️READ FILE*/
//const tours = JSON.parse(fs.readFileSync("./dev-data/data/tours-simple.json", "utf-8"));
const tours = JSON.parse(fs.readFileSync("./dev-data/data/tours.json", "utf-8"));
const users = JSON.parse(fs.readFileSync("./dev-data/data/users.json", "utf-8"));
const reviews = JSON.parse(fs.readFileSync("./dev-data/data/reviews.json", "utf-8"));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️DATA IMPORT INTO DB*/
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); /*to skip user password encryption*/
    /*should comment out 3 middlewares in user model  before import: 💾MIDDLEWARE BEFORE SAVING DATA TO DB */
    await Review.create(reviews);
    console.log("Data succesfuly loaded into DB");
  } catch (err) {
    console.log(err);
  }
  process.exit(); /*to terminate process*/
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️DELETE DATA FROM DB*/
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data succesfuly wiped from DB");
  } catch (err) {
    console.log(err);
  }
  process.exit(); /*to terminate process*/
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//console.log(process.argv);
/*The process.argv property returns an array containing the command-line arguments passed when the Node.js process was launched. The first element will be process.execPath. See process.argv0 if access to the original value of argv[0] is needed. The second element will be the path to the JavaScript file being executed. The remaining elements will be any additional command-line arguments.*/
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
