/* eslint-disable prettier/prettier */
const mongoose = require("mongoose");
const slugify = require("slugify");
//const User = require("./userModel");
//const validator = require("validator");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️CLASS like schema definition*/
const tourSchema = new mongoose.Schema(
  {
    name: {
      /*schema type options in curly braces*/
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true /*to delete whitespaces*/,
      maxLength: [40, "A tour name must have less or equal then 40 characters"],
      minLength: [10, "A tour name must have at least 10 characters"],
      /*validate: [validator.isAlpha, "Tour name must only contain characters"],
      only usefull, if field doesn't contains whitespaces*/
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },

    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },

    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        /*only for strings, to limit entered data to the stated strings*/
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is easy, medium, or difficult",
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Ratings must be at least 1.0"],
      may: [5, "Ratings must be at a maximum of 5.0"],
      set: (val) => Math.round(val * 10) / 10,
      /*💥its a setter function which runs each time a new value is added to ratingsAverage field*/
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },

    priceDiscount: {
      type: Number,
      /*uniqe validator, not in mongoose*/
      validate: {
        validator: function (value) {
          /*this won't work on update, this this only works here!*/
          /*CHECK VALIDATOR ON GITHUB*/
          return value < this.price;
        },
        message: "Discount price ({VALUE}) should be less then regular price",
      },
    },

    summary: {
      type: String,
      required: [true, "A tour must have a summary"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      required: [true, "A tour must have an image cover"],
      trim: true,
    },

    images: [String] /*store images as an array of strings*/,

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false /*to hide from user*/,
    },

    startDates: [Date],

    secretTour: {
      type: Boolean,
      default: false,
    },

    /*💾GEOSPATIAL DATA*/
    startLocation: {
      /*⚙️GEOJSON*/
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
        /*we want with enum, that the only possible option here should be "Point", no vectors or else*/
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      /*with array it becomes an embedded document - see MongoDB documentation*/
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    // guides: Array,
    /*behind the scenes a pre middleware will check the user _id-s defined during create new tour menu, and if valid _id, it add to the guides array*/
    /*⚙️CHILD REFERENCING*/
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        /*we dont even need to import User require, however it will work*/
      },
    ],
    /*⚙️VIRTUAL POPULATE instead of child referencing*/
    // reviews: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: "Review",
    //     /*we dont even need to import User require, however it will work*/
    //   },
    // ],
  },
  {
    toJSON: { virtuals: true } /*the virtuals should be part of the output*/,
    toObject: { virtuals: true },
  }
  /*ensures that virtual properties are appearing in json and object outputs*/
);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️ INDEXING*/
/*one of the most resource heavy query is search by price, so we index it to save computing resourcess*/
//tourSchema.index({ price: 1 }); /*ascending, -1 is descending*/
/*💾COMPOUND INDEX*/
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 }); /*slug is very often used query target*/
tourSchema.index({ startLocation: "2dsphere" }); /*geolocation*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️ VIRTUAL DB DATA (NOT PART OF SCHEMA*/
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});
/*this is not part of the database, so not possible to apply methods on it
it's part of the business logic, thats why we store it in model not in controller (fat model thin controller logic)*/
/*🖥️ VIRTUAL POPULATE (NOT PART OF SCHEMA*/
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour" /*💥tour field comes from the reviewmodel's schema*/,
  localField: "_id" /*reviewschema tour id = tourschema id*/,
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️MONGOOSE MIDDLEWARES: DOCUMENT, QUERY, AGGREGATE AND MODEL*/
/**/
/*💾DOCUMENT MIDDLEWARE runs before .save() and .create() methods on document*/
tourSchema.pre("save", function (next) {
  //console.log(this); regular function to get this
  this.slug = slugify(this.name, { lower: true });
  next();
});

/*💥we wont use the guide embedded mechannics, because we wont store guide id's in tour model, only reference them!*/
// tourSchema.pre("save", async function (next) {
//   /*this pre only works for new documents not for updates*/
//   const guidesPromises = this.guides.map(async (_id) => await User.findById(_id));
//   /*guidesPromises gets a full array of promises*/
//   this.guides = await Promise.all(guidesPromises);
//   /*we collect all the promises, one by one from guidesPromises with the Promise.all method, and then exchange the got promised id-s instead of the simple array data in this.guides!*/
//   next();
// });

// tourSchema.pre("save", (next) => {
//   console.log("Will save document...");
//   next();
// });

// tourSchema.post("save", (doc, next) => {
//   console.log(doc);
//   next();
// });
/**/

/*💾QUERY MIDDLEWARE*/
/*RUNS BEFORE ANY FIND QUERY, like get tour, updatetour, deletetour etc.!*/
tourSchema.pre(/^find/, function (next) {
  /*/^find/ is a regular expression, and with this it will run for all find in the application, not just find, but all find*/
  this.find({ secretTour: { $ne: true } }); /*to not show tours with secretTour: true attributes*/

  this.start = Date.now(); /*to log start date*/
  next();
});
/**/
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt -passwordResetExpires -passwordResetToken",
  });

  next();
});
/*populate will show us all the public guide data (except __v, passwordchangedAt, passwordResetExpires and passwordResetToken), referenced in the relevant tour*/
/*💥POPULATE IS RESOURCE HEAVY!!*/
/**/
/*🗃️TIME CALCULATOR*/
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

/*💾AGGREGATION MIDDLEWARE*/
const GEOSPATIAL_OPERATOR_TEST = /^[$]geo[a-zA-Z]*/;
/*Keeping any future implementation in mind. There can be another aggregate query that might be implemented somewhere in future that uses '$geoWithin' or any other geospatial query that starts with $geo. The above solution will NOT work and give the same error as encountered in the video. To handle that we need to match geo spatial query patterns as below */
tourSchema.pre("aggregate", function (next) {
  const geoAggregate = this.pipeline().filter(
    // finding if the pipeline stage name has any geo operator using the regex. 'search' method on a string returns -1 if the match is not found else non zero value
    (stage) => Object.keys(stage)[0].search(GEOSPATIAL_OPERATOR_TEST) !== -1
  );

  if (geoAggregate.length === 0) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    /*to unselect secret tours from other queries*/
  }
  next();
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const Tour = mongoose.model("Tour", tourSchema);
module.exports = Tour;
