/* eslint-disable prettier/prettier */
const express = require("express");

const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

router.use("/:tourId/reviews", reviewRouter);
/*if URL contains "/:tourID/reviews", go to reviewRouter); and run router.route there);
/*router is a middleware, so we can use use method, which adds, that with this url, we instead use reviewRouter*/
/*💥technically all url requests with tour ID go to reviewRoutes' router function*/

/*⚙️nested routes*/
// router
//   .route("/:tourId/reviews")
//   .post(authController.protect, authController.restrictTo("user"), reviewController.createReview);

//POST /tour/tourId/reviews
//GET /tour/tourId/reviews/reviewId

// router.param("id", (req, res, next, val) => {
//   console.log(`Tour id is: ${val /*id*/}`);
//   next();
// });

//router.param("id", tourController.checkID);
router.route("/top-5-cheap").get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );

router.route("/tours-within/:distance/center/:latlng/unit/:unit").get(tourController.getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  .route("/")
  .get(/*authController.protect, */ tourController.getAllTours)
  /*authController.protect is a middleware which check's if user is valid*/
  .post(
    /*tourController.checkBody,*/
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(authController.protect, authController.restrictTo("admin", "lead-guide"), tourController.deleteTour);

module.exports = router;
