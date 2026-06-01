const express = require('express');
const router = express.Router();
const { 
  AdminTechnicianController,
  TechnicianClientController,
  TechnicianEquipmentController 
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// GET routes — admins, supervisors, and technicians can read
const readAuth = authorize('admin', 'supervisor', 'technician');
// POST/DELETE routes — only admins and supervisors can write
const writeAuth = authorize('admin', 'supervisor');

// Admin-Technician routes
router.get('/admin/:adminId/technicians', readAuth, AdminTechnicianController.getTechniciansByAdmin);
router.get('/technician/:technicianId/admins', readAuth, AdminTechnicianController.getAdminsByTechnician);
router.post('/admin-technician', writeAuth, AdminTechnicianController.assignTechnician);
router.delete('/admin/:adminId/technician/:technicianId', writeAuth, AdminTechnicianController.removeTechnician);

// Technician-Client routes
router.get('/technician/:technicianId/clients', readAuth, TechnicianClientController.getClientsByTechnician);
router.get('/client/:clientId/technicians', readAuth, TechnicianClientController.getTechniciansByClient);
router.post('/technician-client', writeAuth, TechnicianClientController.assignClient);
router.delete('/technician/:technicianId/client/:clientId', writeAuth, TechnicianClientController.removeClient);
router.get('/technician-clients', readAuth, TechnicianClientController.getAllAssignments);

// Technician-Equipment routes
router.get('/technician/:technicianId/equipment', readAuth, TechnicianEquipmentController.getEquipmentByTechnician);
router.get('/equipment/:equipmentId/technicians', readAuth, TechnicianEquipmentController.getTechniciansByEquipment);
router.post('/technician-equipment', writeAuth, TechnicianEquipmentController.assignEquipment);
router.delete('/technician/:technicianId/equipment/:equipmentId', writeAuth, TechnicianEquipmentController.removeEquipment);
router.get('/technician-equipment', readAuth, TechnicianEquipmentController.getAllAssignments);

module.exports = router;