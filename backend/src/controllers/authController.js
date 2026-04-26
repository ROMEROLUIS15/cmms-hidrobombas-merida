const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');
const asyncHandler = require('express-async-handler');
const { generateToken } = require('../utils/jwt');

// Register new user
const register = asyncHandler(async (req, res) => {
    // Accept both camelCase (fullName) and snake_case (full_name) from different clients
    const { fullName, full_name, email, password, role } = req.body;
    const username = fullName || full_name;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase()
          ? 'Email already registered'
          : 'Username already taken'
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: role || 'technician'
    });


    // Generate JWT token
    const token = generateToken(newUser.id, newUser.email, newUser.role);
    
    console.log('✅ Token JWT generado');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser.toJSON()
    });
});

// Login user
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON()
    });
});

module.exports = {
  register,
  login,
  getProfile
};