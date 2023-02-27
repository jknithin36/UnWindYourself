const Review = require('../model/reviewModel');
// const cacthAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  //ALLOW NWSTED ROUTES
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// exports.getAllReviews = cacthAsync(async (req, res, next) => {
//   let filter = {};

//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);
//   res.status(200).json({
//     status: 'Success',
//     results: reviews.length,
//     data: {
//       reviews
//     }
//   });
// });
exports.getAllReviews = factory.getAll(Review);

// exports.createReview = cacthAsync(async (req, res, next) => {
//   const newReview = await Review.create(req.body);
//   res.status(200).json({
//     status: 'Success',
//     data: {
//       reviews: newReview
//     }
//   });
// });

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
