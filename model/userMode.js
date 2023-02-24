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
    minLength: 8
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
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model('USer', userSchema);
module.exports = User;
