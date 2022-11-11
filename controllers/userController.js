const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const handlerFactory = require("./handlerFactory");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*⚙️FOR UNMOIDIFIED IMAGES*/
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
/*⚙️0USE MEMORY BUFFER FOR STORAGING IMAGES TO ENABLE SHARP LATER*/
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image, please upload only imgaes!", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
    /*if current field is an allowed field, than pass this field into the newObj*/
  });
  return newObj;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  /*handlefactory.getOne's id is from url, but we need user id here*/
  next();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);

  /*🗃️ERROR IF USER POSTS PASSWORD DATA*/
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates!", 400));
  }

  /*🗃️FILTER OUT UNWANTED ELEMENTS FROM REQ.BODY - only name and email allowed to change*/
  const filteredBody = filterObj(req.body, "name", "email");

  /*save changed photos name to database: */
  if (req.file) filteredBody.photo = req.file.filename;

  /*🗃️UPDATE USER DOCUMENT - only name and email allowed to change*/
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
/*deleted users stay in DB with a false statuscode for active property*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*💾CREATE*/
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    reqestedAt: req.requestTime,
    message: "This route is not yet defined. Please signup",
  });
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);
/*💥NOT FOR PASSWORD UPDATES!💥*/
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);
