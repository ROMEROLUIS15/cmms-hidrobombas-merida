const express = require('express');
const router = express.Router();
const { getClients, getClientById, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/zodMiddleware');
const { createClientSchema, updateClientSchema } = require('../validators/clientValidators');
const { validateUuidParam } = require('../middleware/validateUuidParam');

router.use(protect);

// Gestión del maestro de clientes: solo admin/supervisor.
const writeAuth = authorize('admin', 'supervisor');
// Un :id malformado llegaría a Postgres y devolvería 500 en vez de 404.
const uuid = validateUuidParam('id');

router.get('/',      getClients);
router.get('/:id',   uuid, getClientById);
router.post('/',     writeAuth, validateRequest(createClientSchema), createClient);
router.put('/:id',   uuid, writeAuth, validateRequest(updateClientSchema), updateClient);
router.delete('/:id', uuid, writeAuth, deleteClient);

module.exports = router;
