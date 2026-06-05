const express = require('express');
const router = express.Router();
const { 
  AdminTechnicianController,
  TechnicianClientController,
  TechnicianEquipmentController 
} = require('../controllers/assignmentController');
const { protect, authorize, authorizeSelfOrAdmin } = require('../middleware/authMiddleware');

router.use(protect);

// Lecturas globales / reverse-lookups — solo admin/supervisor (exponen
// asignaciones de toda la organización).
const adminRead = authorize('admin', 'supervisor');
// Lecturas con ámbito de técnico — admin/supervisor o el propio técnico.
const selfRead = authorizeSelfOrAdmin('technicianId');
// POST/DELETE — solo admin/supervisor.
const writeAuth = authorize('admin', 'supervisor');

// Admin-Technician routes
router.get('/admin/:adminId/technicians', adminRead, AdminTechnicianController.getTechniciansByAdmin);
router.get('/technician/:technicianId/admins', selfRead, AdminTechnicianController.getAdminsByTechnician);
router.post('/admin-technician', writeAuth, AdminTechnicianController.assignTechnician);
router.delete('/admin/:adminId/technician/:technicianId', writeAuth, AdminTechnicianController.removeTechnician);

// Technician-Client routes
router.get('/technician/:technicianId/clients', selfRead, TechnicianClientController.getClientsByTechnician);
router.get('/client/:clientId/technicians', adminRead, TechnicianClientController.getTechniciansByClient);
router.post('/technician-client', writeAuth, TechnicianClientController.assignClient);
router.delete('/technician/:technicianId/client/:clientId', writeAuth, TechnicianClientController.removeClient);
router.get('/technician-clients', adminRead, TechnicianClientController.getAllAssignments);

// Technician-Equipment routes
router.get('/technician/:technicianId/equipment', selfRead, TechnicianEquipmentController.getEquipmentByTechnician);
router.get('/equipment/:equipmentId/technicians', adminRead, TechnicianEquipmentController.getTechniciansByEquipment);
router.post('/technician-equipment', writeAuth, TechnicianEquipmentController.assignEquipment);
router.delete('/technician/:technicianId/equipment/:equipmentId', writeAuth, TechnicianEquipmentController.removeEquipment);
router.get('/technician-equipment', adminRead, TechnicianEquipmentController.getAllAssignments);

module.exports = router;