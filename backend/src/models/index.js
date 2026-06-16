const User = require('./User');
const Client = require('./Client');
const Equipment = require('./Equipment');
const ServiceReport = require('./ServiceReport');
const PasswordResetToken = require('./PasswordResetToken');
const AdminTechnician = require('./AdminTechnician');
const TechnicianClient = require('./TechnicianClient');
const TechnicianEquipment = require('./TechnicianEquipment');
const IdempotencyKey = require('./IdempotencyKey');
const RevokedToken = require('./RevokedToken');
const Counter = require('./Counter');

// Define associations

// Client <-> Equipment (1 to Many)
Client.hasMany(Equipment, { foreignKey: 'clientId', as: 'equipment' });
Equipment.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Equipment <-> ServiceReport (1 to Many)
Equipment.hasMany(ServiceReport, { foreignKey: 'equipmentId', as: 'reports' });
ServiceReport.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

// User (Technician) <-> ServiceReport (1 to Many)
User.hasMany(ServiceReport, { foreignKey: 'userId', as: 'reports' });
ServiceReport.belongsTo(User, { foreignKey: 'userId', as: 'technician' });

// User <-> PasswordResetToken (1 to Many)
User.hasMany(PasswordResetToken, { foreignKey: 'userId', as: 'resetTokens', onDelete: 'CASCADE' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// AdminTechnician: Admin/Supervisor -> Technician (Many to Many)
User.hasMany(AdminTechnician, { foreignKey: 'adminId', as: 'adminAssignments' });
AdminTechnician.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
User.hasMany(AdminTechnician, { foreignKey: 'technicianId', as: 'technicianAssignments' });
AdminTechnician.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });

// TechnicianClient: Technician -> Client (Many to Many)
User.hasMany(TechnicianClient, { foreignKey: 'technicianId', as: 'clientAssignments' });
TechnicianClient.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });
Client.hasMany(TechnicianClient, { foreignKey: 'clientId', as: 'technicianAssignments' });
TechnicianClient.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// TechnicianEquipment: Technician -> Equipment (Many to Many)
User.hasMany(TechnicianEquipment, { foreignKey: 'technicianId', as: 'equipmentAssignments' });
TechnicianEquipment.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });
Equipment.hasMany(TechnicianEquipment, { foreignKey: 'equipmentId', as: 'technicianAssignments' });
TechnicianEquipment.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

module.exports = {
  User,
  Client,
  Equipment,
  ServiceReport,
  PasswordResetToken,
  AdminTechnician,
  TechnicianClient,
  TechnicianEquipment,
  IdempotencyKey,
  RevokedToken,
  Counter
};
