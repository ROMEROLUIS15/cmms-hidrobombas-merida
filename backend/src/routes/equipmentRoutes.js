const express = require('express');
const router = express.Router();
const { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',      getEquipment);        // supports ?clientId= filter
router.get('/:id',   getEquipmentById);
router.post('/',     createEquipment);
router.put('/:id',   updateEquipment);
router.delete('/:id', deleteEquipment);

module.exports = router;
