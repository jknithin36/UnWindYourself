const User = require('../model/userModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

const AppError = require('../utils/appError');

const factory = require('./handlerFactory');

// const AppError = require('../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// exports.getAllusers = catchAsync(async (req, res) => {
//   const users = await User.find();

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users
//     }
//   });
// });
exports.getAllusers = factory.getAll(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet done..!  please USE SIGN_UP ROUTE'
  });
};
exports.getUser = factory.getOne(User);

//DONT UPDATE PASSWORDS WITH THESE
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  //1 Check if user is upadtinga password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'you cannot update passwordhere .. please use /updateMyPassword',
        400
      )
    );
  }
  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
