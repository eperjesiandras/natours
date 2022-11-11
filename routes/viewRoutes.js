const express = require("express");
const viewsController = require("../controllers/viewsController");
const authController = require("../controllers/authController");
const bookingController = require("../controllers/bookingController");

const router = express.Router();

/*from our root folder, we need a handler function, in which the response object renders the base.pug template into the browser*/
// router.get("/", (req, res) => {
//   res.status(200).render("base", {

//     tour: "The Forest Hiker",
//     user: "Andras",
//   });
// });

router.get("/", bookingController.createBookingCheckout, authController.isLoggedIn, viewsController.getOverview);
router.get("/tour/:slug", authController.isLoggedIn, viewsController.getTour);
router.get("/login", authController.isLoggedIn, viewsController.getLoginForm);
router.get("/signup", authController.isLoggedIn, viewsController.signup);
router.get("/me", authController.protect, viewsController.getAccount);
router.get("/my-tours", authController.protect, viewsController.getMyTours);

router.post("/submit-user-data", authController.protect, viewsController.updateUserData);

module.exports = router;
