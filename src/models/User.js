const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    minlength: 6,
    select: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  avatar: String,
  fullName: String,
  dateOfBirth: String,
  timeOfBirth: String,
  placeOfBirth: String,
  subscriptionTier: {
    type: String,
    enum: ['free', 'premium', 'professional'],
    default: 'free',
  },
  creditsRemaining: {
    type: Number,
    default: 10,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('validate', function () {
  if (!this.googleId && !this.password) {
    this.invalidate('password', 'Password is required for email sign-up');
  }
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.statics.generateRandomPassword = function () {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('User', UserSchema);
