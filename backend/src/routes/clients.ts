import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();
const clientController = new ClientController();

// Apply authentication middleware to all client routes
router.use(authenticateToken);

// Create a new client
router.post('/', (req, res) => clientController.createClient(req, res));

// Get all clients with pagination and filtering
router.get('/', (req, res) => clientController.getAllClients(req, res));

// Get client by ID
router.get('/:id', (req, res) => clientController.getClientById(req, res));

// Update client
router.put('/:id', (req, res) => clientController.updateClient(req, res));

// Delete client (soft delete)
router.delete('/:id', (req, res) => clientController.deleteClient(req, res));

// Restore deleted client
router.patch('/:id/restore', (req, res) => clientController.restoreClient(req, res));

export default router;