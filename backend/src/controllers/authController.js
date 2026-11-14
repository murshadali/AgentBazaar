import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'agentbazaar_super_secret_jwt_key_2026_amu', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, city, phone, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      city: city ? city.trim() : 'Aligarh',
      phone: phone ? phone.trim() : '',
      bio: bio ? bio.trim() : 'P2P resale marketplace buyer and seller',
      role: 'USER',
      status: 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        location: user.city,
        bio: user.bio,
        role: user.role,
        status: user.status,
        reputation: user.reputation,
        defaultStyle: user.defaultStyle,
        defaultRounds: user.defaultRounds
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'DEACTIVATED') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        location: user.city,
        bio: user.bio,
        role: user.role,
        status: user.status,
        reputation: user.reputation,
        defaultStyle: user.defaultStyle,
        defaultRounds: user.defaultRounds
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & default strategies
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      name,
      phone,
      city,
      location,
      bio,
      photo,
      avatar,
      defaultStyle,
      defaultRounds
    } = req.body;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (city) user.city = city.trim();
    else if (location) user.city = location.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (photo !== undefined) user.photo = photo;
    else if (avatar !== undefined) user.photo = avatar;
    if (defaultStyle) user.defaultStyle = defaultStyle.toUpperCase();
    if (defaultRounds) user.defaultRounds = Number(defaultRounds);

    const updatedUser = await user.save();

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};
