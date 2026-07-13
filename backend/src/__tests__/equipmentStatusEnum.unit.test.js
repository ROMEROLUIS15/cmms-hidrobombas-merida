const Equipment = require('../models/Equipment');
const { EQUIPMENT_STATUSES, DEFAULT_EQUIPMENT_STATUS } = require('../models/Equipment');
const { createEquipmentSchema, updateEquipmentSchema } = require('../validators/equipmentValidators');

/**
 * Blindaje del bug que rompía producción: el controlador y los validadores
 * tenían sus PROPIAS listas de estados (`active`/`inactive`/`maintenance`), que
 * no existían en el enum de Postgres. Crear un equipo fallaba SIEMPRE con
 * `invalid input value for enum enum_equipment_status: "active"`.
 *
 * Estos tests fijan el contrato: el modelo es la única fuente de verdad y todas
 * las capas deben hablar su mismo idioma.
 */
describe('estados de Equipment: una sola fuente de verdad', () => {
  it('los estados son los del enum real de la BD', () => {
    expect(EQUIPMENT_STATUSES).toEqual(['Operativo', 'En Mantenimiento', 'Dañado']);
    expect(DEFAULT_EQUIPMENT_STATUS).toBe('Operativo');
  });

  it('el atributo del modelo declara EXACTAMENTE esos valores', () => {
    const attr = Equipment.rawAttributes.status;
    expect(attr.values).toEqual(EQUIPMENT_STATUSES);
    expect(attr.defaultValue).toBe(DEFAULT_EQUIPMENT_STATUS);
  });

  describe('validador de creación', () => {
    const base = { name: 'Bomba 1', clientId: '3f2504e0-4f89-11d3-9a0c-0305e82c3301' };

    it('acepta un estado válido', () => {
      const res = createEquipmentSchema.safeParse({ ...base, status: 'En Mantenimiento' });
      expect(res.success).toBe(true);
    });

    it('RECHAZA los estados inventados que causaban el 500', () => {
      for (const malo of ['active', 'inactive', 'maintenance']) {
        const res = createEquipmentSchema.safeParse({ ...base, status: malo });
        expect(res.success).toBe(false);
      }
    });

    it('el estado es opcional (lo pone el default del modelo)', () => {
      const res = createEquipmentSchema.safeParse(base);
      expect(res.success).toBe(true);
      expect(res.data.status).toBeUndefined();
    });
  });

  describe('validador de actualización', () => {
    it('acepta los estados reales (antes los rechazaba)', () => {
      for (const bueno of EQUIPMENT_STATUSES) {
        expect(updateEquipmentSchema.safeParse({ status: bueno }).success).toBe(true);
      }
    });

    it('RECHAZA "active" (antes lo aceptaba y reventaba en la BD)', () => {
      expect(updateEquipmentSchema.safeParse({ status: 'active' }).success).toBe(false);
    });
  });
});
