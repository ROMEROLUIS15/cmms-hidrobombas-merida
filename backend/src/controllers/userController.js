const { User } = require('../models');
const asyncHandler = require('express-async-handler');

const validateUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const getUserById = asyncHandler(async (id) => {
  if (!validateUUID(id)) {
    return null;
  }
  return await User.findByPk(id);
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'DESC']]
  });
  res.json(users);
});

// @desc    Update user status (Activate/Deactivate)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);

  if (user) {
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);

  if (user) {
    user.role = req.body.role || user.role;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);

  if (user) {
    await user.destroy();
    res.json({ message: 'Usuario eliminado' });
  } else {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }
});

module.exports = {
  getUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser
};
