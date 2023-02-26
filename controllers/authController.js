const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

//TO SEND JWT TOKEN TO CLINET FOR MORE SEC 138 10:00 MIN
const createSendToken = (user, stausCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),

    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  //REMOVE THE PASSWORD FROM OUTPUT
  user.password = undefined;
  res.status(stausCode).json({
    status: 'Success',
    token,
    data: {
      user
    }
  });
};

// exports.singup = catchAsync(async (req, res, next) => {
//   const newUser = await User.create(req.body);
//   createSendToken(newUser, 201, res);
//   const token = signToken(newUser._id);

//   res.status(201).json({
//     status: 'Success',
//     token,
//     data: {
//       user: newUser
//     }
//   });
// });
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // const email = req.body.email;
  //1) check if email and password is exists
  if (!email || !password) {
    return next(new AppError('Please provide valid email and password!', 400));
  }
  //2)check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Password or email', 401));
  }
  //3)IF EVERYTHING IS OK SEND TOKEN TO CLIENT
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) GETTING TOKEN AND CHECK IF ITS EXISTS
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('you are not logged in! please log in to get access', 401)
    );
  }
  //2) VALIDATING THE TOKEN(VERIFICATION TOKEN)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) CHECK IF USER STILL EXISTS
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  //4) CHECK IF USER CHANGE PASSWORD AFTER THE TOKEN WAS ISSUED
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('user recently changed password please login again!', 401)
    );
  }
  //ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles [admin,lead-guide]
    if (!roles.includes(req.user.role)) {
      //req.user.role == because in route we a;ready called protect middeleware so we can access the role
      return next(
        new AppError(
          'You dont have access to this action,please contact for acesss'
        ),
        403
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) GET USER ON POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('there is no user with email address', '404'));
  }
  //2) GENERATE THE RANDOM RESET TOKEN
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3 SEND IT TO USERS EMAIL
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 GET USER BASED ON TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2) IF TOKEN IS NOT EXPIRED & THERE IS A USER THEN SET A NEW PASSWORD
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3

  //4 LOG THE USER IN ,SEND JWT

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // GET THE USER FROM COLLECTION
  const user = await User.findById(req.user.id).select('+password');
  //CHECK IF CURRENT PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('your Current password is not correct', 401));
  }
  //IF PASSWORD IS CORRECT UPDATE IT
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //user.findByIDandUpdate will not work as intented // for more sec 138 8:00 min
  //LOG USER SEND JWT
  createSendToken(user, 200, res);
});
