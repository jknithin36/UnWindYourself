const User = require('../model/userMode');
const catchAsync = require('../utils/catchAsync');

exports.singup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  res.status(201).json({
    status: 'Success',
    data: {
      user: newUser
    }
  });
});
