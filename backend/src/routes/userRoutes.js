const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  updateUserStatus, 
  updateUserRole, 
  deleteUser 
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Todas estas rutas están protegidas y solo son para administradores
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers);

router.route('/:id/status')
  .put(updateUserStatus);

router.route('/:id/role')
  .put(updateUserRole);

router.route('/:id')
  .delete(deleteUser);

module.exports = router;
