const User = require('./User');
const Client = require('./Client');
const Equipment = require('./Equipment');
const ServiceReport = require('./ServiceReport');
const PasswordResetToken = require('./PasswordResetToken');

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

module.exports = {
  User,
  Client,
  Equipment,
  ServiceReport,
  PasswordResetToken
};
