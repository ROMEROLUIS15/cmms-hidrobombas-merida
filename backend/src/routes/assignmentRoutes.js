const express = require('express');
const router = express.Router();
const { 
  AdminTechnicianController,
  TechnicianClientController,
  TechnicianEquipmentController 
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'supervisor'));

// Admin-Technician routes
router.get('/admin/:adminId/technicians', AdminTechnicianController.getTechniciansByAdmin);
router.get('/technician/:technicianId/admins', AdminTechnicianController.getAdminsByTechnician);
router.post('/admin-technician', AdminTechnicianController.assignTechnician);
router.delete('/admin/:adminId/technician/:technicianId', AdminTechnicianController.removeTechnician);

// Technician-Client routes
router.get('/technician/:technicianId/clients', TechnicianClientController.getClientsByTechnician);
router.get('/client/:clientId/technicians', TechnicianClientController.getTechniciansByClient);
router.post('/technician-client', TechnicianClientController.assignClient);
router.delete('/technician/:technicianId/client/:clientId', TechnicianClientController.removeClient);
router.get('/technician-clients', TechnicianClientController.getAllAssignments);

// Technician-Equipment routes
router.get('/technician/:technicianId/equipment', TechnicianEquipmentController.getEquipmentByTechnician);
router.get('/equipment/:equipmentId/technicians', TechnicianEquipmentController.getTechniciansByEquipment);
router.post('/technician-equipment', TechnicianEquipmentController.assignEquipment);
router.delete('/technician/:technicianId/equipment/:equipmentId', TechnicianEquipmentController.removeEquipment);
router.get('/technician-equipment', TechnicianEquipmentController.getAllAssignments);

module.exports = router;