const express = require('express');
const router = express.Router();
const { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/zodMiddleware');
const { createEquipmentSchema, updateEquipmentSchema } = require('../validators/equipmentValidators');

router.use(protect);

// Gestión del maestro de equipos: solo admin/supervisor.
const writeAuth = authorize('admin', 'supervisor');

router.get('/',      getEquipment);        // supports ?clientId= filter
router.get('/:id',   getEquipmentById);
router.post('/',     writeAuth, validateRequest(createEquipmentSchema), createEquipment);
router.put('/:id',   writeAuth, validateRequest(updateEquipmentSchema), updateEquipment);
router.delete('/:id', writeAuth, deleteEquipment);

module.exports = router;
