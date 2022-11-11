/* eslint-disable no-unused-vars */
const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },

  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
    /*built in validator, needs const validator to use*/
  },

  photo: {
    type: String,
    default: "default.jpg",
  },

  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },

  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
    /*select: {Boolean} - Specifies default path selection behavior. In other words, you can specify if this path should be included or excluded from query results by default.*/
  },

  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE, no UPDATE!!!
      validator: function (el) {
        return el === this.password; /*password === password, if false, it returns an error!*/
      },
      message: "Passwords are not the same!",
    },
  },

  passwordChangedAt: Date,

  passwordResetToken: String,

  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*💾MIDDLEWARE BEFORE SAVING DATA TO DB*/
userSchema.pre("save", async function (next) {
  /*Only runs if password was modified*/
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  /*hash is async here, so returns a promise, thats why we need await. 12 is the rounds of the encryption, default is 10. 12 is ok nowadays. When you are hashing your data the module will go through a series of rounds to give you a secure hash. The value you submit there is not just the number of rounds that the module will go through to hash your data. The module will use the value you enter and go through 2^rounds iterations of processing.*/

  this.passwordConfirm = undefined;
  /*because we dont want to store confirm password since we hashed the original*/

  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew /*the document is new*/) return next();

  this.passwordChangedAt = Date.now() - 1000;
  /*because sometimes token created sooner than password, so user is unable to log in... so we push password change status into the past with 1 second */

  next();
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
userSchema.pre(/^find/, function (next) {
  /*this works with all queries which contains "find", e.g. findby etc, or like in the getallusers function in usercontroller*/
  // this points to the current query
  this.find({ active: { $ne: false } });
  /*find all documents, where active property is not equal to false*/
  next();
});

/*🖥️INSTANCE METHOD, which means it is available in all documents!: */
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    // console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
    /*only true if token is older than password change, if not => error*/
  }

  return false; /*= password not changed*/
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
