/* eslint-disable prefer-const */
const multer = require("multer");
const sharp = require("sharp");
const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const handlerFactory = require("./handlerFactory");
const AppError = require("../utils/appError");
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);
/*
upload.single("image"); if only 1 file is loaded -- req.file
upload.array("images", 5); if only 1 type of file is loaded, plus the max number uploadable -- req.files
*/

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  //if (!req.files.imageCover || !req.files.images) return next();

  /*🖥️DELETE UNUSED IMAGES FROM DB*/
  const tour = await Tour.findById(req.params.id);
  if (tour.images.length > 0 && fs.existsSync(`public/img/tours/${tour.images[0]}`)) {
    tour.images.forEach((image) => {
      fs.unlinkSync(`public/img/tours/${image}`);
    });
  }
  if (tour.imageCover && fs.existsSync(`public/img/tours/${tour.imageCover}`)) {
    fs.unlinkSync(`public/img/tours/${tour.imageCover}`);
  }

  /*🖥️COVER IMAGE*/
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  /*🖥️IMAGES*/
  req.body.images = [];

  await Promise.all(
    /*promise.all because we should wait for all 3 image uploads, and then after we step forward to next()*/
    req.files.images.map(async (file, i) => {
      /*.map helps us to store the results in an array*/
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*🖥️MIDDLEWARE*/
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,difficulty,summary";
  next();
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.getAllTours = handlerFactory.getAll(Tour);
exports.getTour = handlerFactory.getOne(Tour, { path: "reviews" });
exports.createTour = handlerFactory.createOne(Tour);
exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️AGGREGATION PIPELINE*/
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: /*to make difficoulties to uppercase*/ "$difficulty" } /*kind of sorter by our preference*/,
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } } /*select documents which are not easy*/
    // }
  ]);

  res.status(200).json({
    status: "success",
    //reqestedAt: req.requestTime,
    data: {
      stats,
    },
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️BUSINESS LOGIC - MONTHLY PLANNING*/
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2022

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
      /*unwind deconstructs an array field from documents and then outputs one document for each element of the array*/
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 } /*add the matching tours together*/,
        tours: { $push: "$name" } /*to find which tours are matching our criteria*/,
      },
    },
    {
      $addFields: { month: "$_id" } /*to add the relevant month and it!s number to data*/,
    },
    {
      $project: {
        _id: 0 /*to hide the id from list*/,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12 /*to limit the results*/,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
/*check Schema in MongoDB Compass*/
/*https://www.mongodb.com/docs/manual/reference/operator/query/*/
exports.getToursWithin = catchAsync(async (req, res, next) => {
  /*destructuring*/
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  /*radius of Earth in miles or km*/

  if (!lat || !lng) {
    next(new AppError("Please provide latitude and longitude in the format lat,lng.", 400));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError("Please provide latitude and longitude in the format lat,lng.", 400));
  }
  /*for calculation, we use aggregate*/
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        /*💥always needs at least 1 geospatiol index!!! See tour model tourSchema.index({ startLocation: "2dsphere" }); /*geolocation*/
        /*$geoNear is only valid as the first stage in a pipeline, see tourModel tourSchema.pre(aggregate) solution*/
        near: {
          /*GeoJSON*/
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
        /*to get the result properly in miles or kilometers*/
      },
    },
    {
      /*🗃️to get rid of needles data from GET query list*/
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      data: distances,
    },
  });
});
