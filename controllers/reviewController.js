const Review = require("../models/reviewModel");
//const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   /*💥COLLECT ONLY THE TOUR'S RELEVANT REVIEWS, NOT ALL THE REVIEWS*/
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   /*we check if theres a tourId in url. If so, we will gonna search only reviews where tour equal to tourId*/
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: "success",
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

/*🗃️ALLOW NESTED ROUTES WITH MIDDLEWARE*/
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  /*if we didn't specify the tour id in the body, then tourId is coming from the url (req.params = url parameter)*/
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// exports.createReview = catchAsync(async (req, res, next) => {
//   // /*🗃️ALLOW NESTED ROUTES*/
//   // if (!req.body.tour) req.body.tour = req.params.tourId;
//   // /*if we didn't specify the tour id in the body, then tourId is coming from the url (req.params = url parameter)*/
//   // if (!req.body.user) req.body.user = req.user.id;

//   const newReview = await Review.create(req.body);
//   /*all the data are not in reviewSchema will be ignored during this create*/
//   res.status(201).json({
//     status: "success",
//     data: {
//       review: newReview,
//     },
//   });
// });

// exports.getAllReviews = factory.getAll(Review);
// exports.getReview = factory.getOne(Review);
exports.getAllReviews = handlerFactory.getAll(Review);
exports.getReview = handlerFactory.getOne(Review);
exports.createReview = handlerFactory.createOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
