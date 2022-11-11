const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true /*to check live validators*/,
    });

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      //reqestedAt: req.requestTime,
      data: {
        data: doc,
      },
    });
  });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      //reqestedAt: req.requestTime,
      data: "null",
    });
  });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    // const doc = await Model.findById(req.params.id).populate("reviews");

    /*same as: Tour.findOne({_id: req.params.id})*/

    if (!doc) {
      return next(new AppError("No document was found with that ID", 404));
    }
    /*should return or else it jumps to res.status...*/
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    /*🗃️To allow for nested GET reviews on tour (hack)*/
    let filter = {};
    /*💥COLLECT ONLY THE TOUR'S RELEVANT REVIEWS, NOT ALL THE REVIEWS*/
    if (req.params.tourId) filter = { tour: req.params.tourId };
    /*we check if theres a tourId in url. If so, we will gonna search only reviews where tour equal to tourId*/

    /*💾QUERY EXECUTION*/
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();
    /*⚙️EXPLAIN METHOD TO GET DATA FROM QUERIES*/
    //const doc = await features.query.explain();

    const doc = await features.query;
    /*💾SEND RESPONSE*/
    res.status(200).json({
      status: "success",

      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
