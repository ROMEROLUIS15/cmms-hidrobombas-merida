const express = require('express');
const router = express.Router();
const { getClients, getClientById, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/zodMiddleware');
const { createClientSchema, updateClientSchema } = require('../validators/clientValidators');

router.use(protect);

// Gestión del maestro de clientes: solo admin/supervisor.
const writeAuth = authorize('admin', 'supervisor');

router.get('/',      getClients);
router.get('/:id',   getClientById);
router.post('/',     writeAuth, validateRequest(createClientSchema), createClient);
router.put('/:id',   writeAuth, validateRequest(updateClientSchema), updateClient);
router.delete('/:id', writeAuth, deleteClient);

module.exports = router;
