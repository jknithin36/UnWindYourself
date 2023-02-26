const Review = require('../model/reviewModel');
const cacthAsync = require('../utils/catchAsync');

exports.getAllReviews = cacthAsync(async (req, res, next) => {
  const reviews = await Review.find().populate('reviews');
  res.status(200).json({
    status: 'Success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

exports.createReview = cacthAsync(async (req, res, next) => {
  const newReview = await Review.create(req.body);
  res.status(200).json({
    status: 'Success',
    data: {
      reviews: newReview
    }
  });
});
