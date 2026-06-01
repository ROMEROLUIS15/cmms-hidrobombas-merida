const express = require('express');
const router = express.Router();
const { getClients, getClientById, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/zodMiddleware');
const { createClientSchema, updateClientSchema } = require('../validators/clientValidators');

router.use(protect);

router.get('/',      getClients);
router.get('/:id',   getClientById);
router.post('/',     validateRequest(createClientSchema), createClient);
router.put('/:id',   validateRequest(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
