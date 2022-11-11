/* eslint-disable no-unused-vars */
const mongoose = require("mongoose");
const Tour = require("./tourModel");
const User = require("./userModel");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      /*💥noi Date.now(), because it would store the date of the schema creation, not the document creation...*/
    },

    tour: {
      /*💥technically it's a tour's id*/
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
  /*ensures that virtual properties are appearing in json and object outputs*/
);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
/*this compound index prevents user to review a tour more than onceby a single user, because each combination of tours and users should be uniqe*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
reviewSchema.pre(/^find/, function (next) {
  this./*populate({
    path: "tour",
    select: "name",
  }).*/ populate({
    path: "user",
    select: "name photo",
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate(
    /*💥in static method, this points to the current model, so we aggregate on the current model*/
    [
      {
        $match: { tour: tourId } /*we select only the tour we want to update by it's id*/,
      },
      {
        $group: {
          _id: "$tour" /*grouping reviews by tour*/,
          nRating: { $sum: 1 } /*number of ratings: summing up reviews one by one*/,
          avgRating: { $avg: "$rating" },
        },
      },
    ]
  );

  //console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post("save", function () {
  /*no next in post*/
  /*💥.pre is no good for this, because we should save reviews after the calculations.*/
  /*This points to the current review!*/
  this.constructor.calcAverageRatings(this.tour);
  /*c💥onstructor helps us to solve the issue that Review is not yet declared yet, and not possible to run this middleware after we declared REview, below. Constructor is the Model, which created this current document...*/
});

/*🗃️we need to find a solution for recalculating the averages in reviews if a review is updated, or deleted. findByIdAndUpdate and findByIdAndDelete are  working with only as queries. They dont have document middleware but query middleware only. In query, we dont have direct access to document. So we create a pre middleware to circumvent this limitation. */
reviewSchema.pre(/^findOneAnd/, async function (next) {
  /*pre middleware needs next*/
  this.rev = await this.findOne().clone();
  /*https://mongoosejs.com/docs/migrating_to_6.html#duplicate-query-execution*/
  /*Mongoose no longer allows executing the same query object twice. If you do, you'll get a Query was already executed error. Executing the same query instance twice is typically indicative of mixing callbacks and promises, but if you need to execute the same query twice, you can call Query#clone() to clone the query and re-execute it.*/
  // console.log(this.r);
  /*💥this is the current query here. we execute the query in order to get access to current document*/
  //console.log(this.review);
  next();
});
/*now we can post the update*/
reviewSchema.post(/^findOneAnd/, async function () {
  /*💥this.review = await this.findOne() will not work here, because the query has already been executed!*/
  await this.rev.constructor.calcAverageRatings(this.rev.tour);
  /*we passed the data from the previous pre middleware to the post middleware.*/
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
