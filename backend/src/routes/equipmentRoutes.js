const express = require('express');
const router = express.Router();
const { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/zodMiddleware');
const { createEquipmentSchema, updateEquipmentSchema } = require('../validators/equipmentValidators');

router.use(protect);

router.get('/',      getEquipment);        // supports ?clientId= filter
router.get('/:id',   getEquipmentById);
router.post('/',     validateRequest(createEquipmentSchema), createEquipment);
router.put('/:id',   validateRequest(updateEquipmentSchema), updateEquipment);
router.delete('/:id', deleteEquipment);

module.exports = router;
