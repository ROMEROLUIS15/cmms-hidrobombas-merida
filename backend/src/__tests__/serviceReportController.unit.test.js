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
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getServiceReports', () => {
    it('should return all reports with associations', async () => {
      ServiceReport.findAll.mockResolvedValue([{ id: 1, reportNumber: 'SRV-0001' }]);

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
      req.params = { id: 1 };
      ServiceReport.findByPk.mockResolvedValue({ id: 1, reportNumber: 'SRV-0001' });

      await getServiceReportById(req, res);

      expect(ServiceReport.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 if report not found', async () => {
      req.params = { id: 99 };
      ServiceReport.findByPk.mockResolvedValue(null);

      await getServiceReportById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('createServiceReport', () => {
    it('should return 400 if equipment_id is missing', async () => {
      req.body = { visit_type: 'mensual' };

      await createServiceReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should create a report and return full object', async () => {
      req.body = { equipment_id: 1, motor_1_data: { amps: 10 } };
      req.user = { id: 2, username: 'tech1' };

      ServiceReport.count.mockResolvedValue(0);
      ServiceReport.create.mockResolvedValue({ id: 1 });
      ServiceReport.findByPk.mockResolvedValue({ id: 1, reportNumber: 'SRV-0001' });

      await createServiceReport(req, res);

      expect(ServiceReport.count).toHaveBeenCalled();
      expect(ServiceReport.create).toHaveBeenCalledWith(expect.objectContaining({
        reportNumber: 'SRV-0001',
        equipmentId: 1,
        userId: 2,
        motorsData: [{ amps: 10 }]
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('updateServiceReport', () => {
    it('should return 404 if report not found', async () => {
      req.params = { id: 99 };
      ServiceReport.findByPk.mockResolvedValue(null);

      await updateServiceReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update report successfully', async () => {
      req.params = { id: 1 };
      req.body = { visit_type: 'eventual', motor_1_data: { amps: 15 } };
      
      const mockReport = { update: jest.fn().mockResolvedValue() };
      ServiceReport.findByPk.mockResolvedValue(mockReport);

      await updateServiceReport(req, res);

      expect(mockReport.update).toHaveBeenCalledWith(expect.objectContaining({
        visitType: 'eventual',
        motorsData: [{ amps: 15 }]
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('deleteServiceReport', () => {
    it('should return 404 if report not found', async () => {
      req.params = { id: 99 };
      ServiceReport.findByPk.mockResolvedValue(null);

      await deleteServiceReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete report successfully', async () => {
      req.params = { id: 1 };
      const mockReport = { destroy: jest.fn().mockResolvedValue() };
      ServiceReport.findByPk.mockResolvedValue(mockReport);

      await deleteServiceReport(req, res);

      expect(mockReport.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
