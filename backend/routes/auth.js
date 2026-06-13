const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');

const {
    register,
    login,
    getLoggedUser,
    updateProfile,
    updatePassword
} = require('../controllers/authController');

const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], login);

// @route   GET api/auth
// @desc    Get logged in user
// @access  Private
router.get('/', auth, getLoggedUser);

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, upload.single('profilePic'), [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail()
], updateProfile);

// @route   PUT api/auth/password
// @desc    Update user password
// @access  Private
router.put('/password', [auth, [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 })
]], updatePassword);

module.exports = router;
