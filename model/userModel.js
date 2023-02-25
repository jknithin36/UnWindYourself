const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please tell us your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Enter a Valid Email']
  },
  photo: {
    type: String
  },
  password: {
    type: String,
    required: [true, 'please provide a password'],
    minLength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please Confirm a password'],
    validate: {
      validator: function(el) {
        return el === this.password;
        //CONFIRM PASSWORD VALIDATION
      },
      message: 'passwords are not same'
    }
  },
  passwordChangedAt: Date
});

userSchema.pre('save', async function(next) {
  //ONLY RUN THIS FUNCTION IF THIS IS MODIFIED
  if (!this.isModified('password')) return next();
  //HASH THE PASSWORD
  this.password = await bcrypt.hash(this.password, 12);
  //DELETE THE PASSWOED FEILD
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassowrd,
  userPassword
) {
  return await bcrypt.compare(candidatePassowrd, userPassword);
};

//
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(this.passwordChangedAt, JWTTimestamp);

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};
const User = mongoose.model('USer', userSchema);
module.exports = User;
