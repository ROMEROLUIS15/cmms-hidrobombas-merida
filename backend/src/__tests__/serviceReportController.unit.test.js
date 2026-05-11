const {
  getServiceReports,
  getServiceReportById,
  createServiceReport,
  updateServiceReport,
  deleteServiceReport
} = require('../controllers/serviceReportController');
const { ServiceReport, Equipment, Client, User } = require('../models');

jest.mock('../models');

describe('Service Report Controller Unit Tests', () => {
  let req, res, next;
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    req = { params: {}, body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getServiceReports', () => {
    it('should return all reports with associations', async () => {
      ServiceReport.findAll.mockResolvedValue([{ id: validUUID, reportNumber: 'SRV-0001' }]);

      await getServiceReports(req, res);

      expect(ServiceReport.findAll).toHaveBeenCalledWith(expect.objectContaining({
        include: expect.any(Array),
        order: [['createdAt', 'DESC']]
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getServiceReportById', () => {
    it('should return a report by id', async () => {
      req.params = { id: validUUID };
      ServiceReport.findByPk.mockResolvedValue({ id: validUUID, reportNumber: 'SRV-0001' });

      await getServiceReportById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next with error if report not found', async () => {
      req.params = { id: validUUID };
      ServiceReport.findByPk.mockResolvedValue(null);

      await getServiceReportById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reporte no encontrado', statusCode: 404 }));
    });

    it('should call next with error for invalid UUID', async () => {
      req.params = { id: '999' };

      await getServiceReportById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reporte no encontrado', statusCode: 404 }));
    });
  });

  describe('createServiceReport', () => {
    it('should return 400 if equipment_id is missing', async () => {
      req.body = { visit_type: 'mensual' };

      await createServiceReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should create a report and return full object', async () => {
      req.body = { equipment_id: validUUID, motor_1_data: { amps: 10 } };
      req.user = { id: validUUID, username: 'tech1' };

      ServiceReport.count.mockResolvedValue(0);
      ServiceReport.create.mockResolvedValue({ id: validUUID, reportNumber: 'SRV-0001' });
      ServiceReport.findByPk.mockResolvedValue({ id: validUUID, reportNumber: 'SRV-0001' });

      await createServiceReport(req, res, next);

      expect(ServiceReport.count).toHaveBeenCalled();
      expect(ServiceReport.create).toHaveBeenCalledWith(expect.objectContaining({
        reportNumber: 'SRV-0001',
        equipmentId: validUUID,
        userId: validUUID,
        motorsData: [{ amps: 10 }]
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('updateServiceReport', () => {
    it('should call next with error if report not found', async () => {
      req.params = { id: validUUID };
      ServiceReport.findByPk.mockResolvedValue(null);

      await updateServiceReport(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reporte no encontrado', statusCode: 404 }));
    });

    it('should update report successfully', async () => {
      req.params = { id: validUUID };
      req.body = { visit_type: 'eventual', motor_1_data: { amps: 15 } };
      
      const mockReport = { update: jest.fn().mockResolvedValue() };
      ServiceReport.findByPk.mockResolvedValue(mockReport);

      await updateServiceReport(req, res, next);

      expect(mockReport.update).toHaveBeenCalledWith(expect.objectContaining({
        visitType: 'eventual',
        motorsData: [{ amps: 15 }]
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next with error for invalid UUID', async () => {
      req.params = { id: '999' };

      await updateServiceReport(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reporte no encontrado', statusCode: 404 }));
    });
  });

  describe('deleteServiceReport', () => {
    it('should call next with error if report not found', async () => {
      req.params = { id: validUUID };
      ServiceReport.findByPk.mockResolvedValue(null);

      await deleteServiceReport(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reporte no encontrado', statusCode: 404 }));
    });

    it('should delete report successfully', async () => {
      req.params = { id: validUUID };
      const mockReport = { destroy: jest.fn().mockResolvedValue() };
      ServiceReport.findByPk.mockResolvedValue(mockReport);

      await deleteServiceReport(req, res, next);

      expect(mockReport.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next with error for invalid UUID', async () => {
      req.params = { id: '999' };

      await deleteServiceReport(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reporte no encontrado', statusCode: 404 }));
    });
  });
});