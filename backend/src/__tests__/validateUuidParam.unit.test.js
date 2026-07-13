const { validateUuidParam } = require('../middleware/validateUuidParam');
const { VISIT_TYPES } = require('../models/ServiceReport');
const { createServiceReportSchema } = require('../validators/serviceReportValidators');

/**
 * Dos defectos encontrados al ejercitar el flujo real contra PRODUCCIÓN. Los dos
 * devolvían 500 (error del servidor) cuando debían devolver 4xx (error del
 * cliente), y los dos eran invisibles en la suite porque los tests corren contra
 * SQLite, que no valida ni los UUID ni los ENUM. Postgres sí.
 */
describe('validateUuidParam', () => {
  const run = (value) => {
    const req = { params: { id: value } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    validateUuidParam('id')(req, res, next);
    return { res, next };
  };

  it('deja pasar un UUID válido', () => {
    const { next, res } = run('3f2504e0-4f89-11d3-9a0c-0305e82c3301');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('corta con 404 un id malformado (antes: 500 desde Postgres)', () => {
    // Caso real: GET /api/service-reports/undefined/pdf reventaba con
    // `invalid input syntax for type uuid: "undefined"`.
    for (const malo of ['undefined', 'null', 'non-existent-id', '123', '']) {
      const { next, res } = run(malo);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).not.toHaveBeenCalled();
    }
  });
});

describe('visit_type: el validador refleja el enum de la BD', () => {
  const base = { equipment_id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301' };

  it('acepta los tipos reales', () => {
    for (const t of VISIT_TYPES) {
      expect(createServiceReportSchema.safeParse({ ...base, visit_type: t }).success).toBe(true);
    }
  });

  it('RECHAZA con 400 un tipo inválido (antes llegaba a la BD y daba 500)', () => {
    // 'Preventivo' parece razonable, pero no existe en enum_service_reports_visitType.
    const res = createServiceReportSchema.safeParse({ ...base, visit_type: 'Preventivo' });
    expect(res.success).toBe(false);
  });
});
