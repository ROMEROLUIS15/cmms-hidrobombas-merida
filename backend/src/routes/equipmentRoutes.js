const express = require('express');
const router = express.Router();
const { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/zodMiddleware');
const { createEquipmentSchema, updateEquipmentSchema } = require('../validators/equipmentValidators');
const { validateUuidParam } = require('../middleware/validateUuidParam');

router.use(protect);

// Gestión del maestro de equipos: solo admin/supervisor.
const writeAuth = authorize('admin', 'supervisor');
// Un :id malformado llegaría a Postgres y devolvería 500 en vez de 404.
const uuid = validateUuidParam('id');

router.get('/',      getEquipment);        // supports ?clientId= filter
router.get('/:id',   uuid, getEquipmentById);
router.post('/',     writeAuth, validateRequest(createEquipmentSchema), createEquipment);
router.put('/:id',   uuid, writeAuth, validateRequest(updateEquipmentSchema), updateEquipment);
router.delete('/:id', uuid, writeAuth, deleteEquipment);

module.exports = router;
