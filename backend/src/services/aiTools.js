/**
 * 🛠️ AI Tools - Herramientas que el Agent ejecuta
 * 
 * Cada herramienta:
 * 1. Obtiene datos de BD
 * 2. Llama al LLM con prompt específico
 * 3. Parsea respuesta JSON
 * 4. Retorna resultado
 */

const { sequelize } = require('../config/database');
const { ServiceReport, Equipment, Client } = require('../models');
const PROMPTS = require('./aiPrompts');

/**
 * Utilidad: Obtener promedio histórico de parámetros técnicos
 */
const getHistoricalAverage = async (equipmentId, months = 6) => {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const reports = await ServiceReport.findAll({
    where: {
      equipmentId,
      createdAt: { [sequelize.Op.gte]: since }
    },
    limit: 10,
    order: [['createdAt', 'DESC']]
  });

  if (reports.length === 0) return null;

  // Extraer y promediar parámetros numéricos
  const waterData = reports.map(r => r.waterEnergyData).filter(Boolean);
  const motorData = reports.map(r => r.motorsData).filter(Boolean).flat();

  const avg = {
    avgVoltageRS: waterData.map(w => w.voltage_r_s).reduce((a, b) => a + b, 0) / waterData.length || 0,
    avgMotorTemp: motorData.map(m => m.motor_temp).reduce((a, b) => a + b, 0) / motorData.length || 0,
    avgAmperage: motorData.map(m => m.amperage).reduce((a, b) => a + b, 0) / motorData.length || 0,
    count: reports.length
  };

  return { avg, reports: reports.slice(0, 6) };
};

/**
 * Utilidad: Parsear respuesta JSON del LLM
 */
const parseJSONResponse = (text) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (_e) {
    console.warn('Failed to parse JSON response:', _e.message);
  }
  return null;
};

/**
 * Utilidad: Llamar al LLM (Groq)
 */
const callLLM = async (prompt, groqClient) => {
  try {
    const message = await groqClient.messages.create({
      model: 'mixtral-8x7b-32768', // Modelo gratuito de Groq
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });
    return message.content[0].text;
  } catch (error) {
    console.error('LLM Error:', error.message);
    throw new Error(`LLM call failed: ${error.message}`, { cause: error });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// HERRAMIENTA 1: Generar Reporte
// ═════════════════════════════════════════════════════════════════════════════

const generateReportTool = {
  name: 'generate_report',
  description: 'Genera un reporte profesional de mantenimiento basado en datos técnicos',
  
  execute: async (input, groqClient) => {
    const { serviceReportId } = input;

    const report = await ServiceReport.findByPk(serviceReportId, {
      include: [
        { model: Equipment, as: 'equipment' },
        { model: Client, as: 'client', through: Equipment }
      ]
    });

    if (!report) throw new Error('Report not found');

    // Preparar datos técnicos
    const technicalData = {
      waterEnergy: report.waterEnergyData,
      motors: report.motorsData,
      control: report.controlData,
      observations: report.observations
    };

    // Llamar LLM
    const prompt = PROMPTS.GENERATE_REPORT.replace(
      '{technicalData}',
      JSON.stringify(technicalData, null, 2)
    );

    const response = await callLLM(prompt, groqClient);
    const parsed = parseJSONResponse(response);

    // Guardar resultado en reporte
    if (parsed) {
      await report.update({
        description: parsed.description,
        recommendations: parsed.recommendations,
        partsUsed: parsed.partsUsed,
        cost: parsed.estimatedCost
      });
    }

    return {
      success: true,
      reportId: serviceReportId,
      generated: parsed,
      message: 'Reporte generado exitosamente'
    };
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// HERRAMIENTA 2: Chat Técnico
// ═════════════════════════════════════════════════════════════════════════════

const askEquipmentTool = {
  name: 'ask_equipment',
  description: 'Responde preguntas técnicas sobre equipos basándose en historial',
  
  execute: async (input, groqClient) => {
    const { equipmentId, question } = input;

    const equipment = await Equipment.findByPk(equipmentId, {
      include: [{ model: Client, as: 'client' }]
    });

    if (!equipment) throw new Error('Equipment not found');

    // Obtener historial
    const { reports } = await getHistoricalAverage(equipmentId);
    
    const recentHistory = reports
      .map(r => `${r.reportDate}: ${r.observations || 'N/A'}`)
      .join('\n');

    // Llamar LLM
    const prompt = PROMPTS.TECHNICAL_CHAT
      .replace('{equipmentName}', equipment.name)
      .replace('{equipmentType}', equipment.type || 'Unknown')
      .replace('{serialNumber}', equipment.serialNumber || 'N/A')
      .replace('{brand}', equipment.brand || 'Unknown')
      .replace('{recentHistory}', recentHistory || 'No history available')
      .replace('{userQuestion}', question);

    const response = await callLLM(prompt, groqClient);
    const parsed = parseJSONResponse(response);

    return {
      success: true,
      equipmentId,
      answer: parsed?.answer || response,
      confidence: parsed?.confidence || 0.7,
      sourceReports: parsed?.sourceReports || []
    };
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// HERRAMIENTA 3: Detectar Anomalías
// ═════════════════════════════════════════════════════════════════════════════

const detectAnomalyTool = {
  name: 'detect_anomaly',
  description: 'Detecta anomalías comparando datos actuales vs histórico',
  
  execute: async (input, groqClient) => {
    const { serviceReportId } = input;

    const report = await ServiceReport.findByPk(serviceReportId, {
      include: [{ model: Equipment, as: 'equipment' }]
    });

    if (!report) throw new Error('Report not found');

    // Obtener histórico
    const { avg } = await getHistoricalAverage(report.equipmentId) || {};

    if (!avg) {
      return { success: true, anomalyDetected: false, reason: 'Not enough historical data' };
    }

    // Preparar datos
    const currentData = {
      waterEnergy: report.waterEnergyData,
      motors: report.motorsData
    };

    const prompt = PROMPTS.DETECT_ANOMALY
      .replace('{currentData}', JSON.stringify(currentData, null, 2))
      .replace('{historicalAverage}', JSON.stringify(avg, null, 2));

    const response = await callLLM(prompt, groqClient);
    const parsed = parseJSONResponse(response);

    return {
      success: true,
      reportId: serviceReportId,
      analysis: parsed || { anomalyDetected: false }
    };
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// HERRAMIENTA 4: Recomendar Mantenimiento
// ═════════════════════════════════════════════════════════════════════════════

const recommendMaintenanceTool = {
  name: 'recommend_maintenance',
  description: 'Recomienda próxima fecha de mantenimiento preventivo',
  
  execute: async (input, groqClient) => {
    const { equipmentId } = input;

    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) throw new Error('Equipment not found');

    // Obtener historial
    const { reports } = await getHistoricalAverage(equipmentId, 12) || { reports: [] };

    const maintenanceHistory = reports
      .map(r => `${r.reportDate}: ${r.visitType} - ${r.observations || 'N/A'}`)
      .join('\n');

    const equipmentAge = Math.floor((Date.now() - new Date(equipment.createdAt)) / (1000 * 60 * 60 * 24 * 30));

    const prompt = PROMPTS.MAINTENANCE_RECOMMENDATION
      .replace('{equipmentName}', equipment.name)
      .replace('{equipmentAge}', equipmentAge)
      .replace('{maintenanceHistory}', maintenanceHistory || 'No history');

    const response = await callLLM(prompt, groqClient);
    const parsed = parseJSONResponse(response);

    return {
      success: true,
      equipmentId,
      recommendation: parsed || { nextMaintenanceDate: null }
    };
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// HERRAMIENTA 5: Comparar Equipos
// ═════════════════════════════════════════════════════════════════════════════

const compareEquipmentTool = {
  name: 'compare_equipment',
  description: 'Compara performance entre dos equipos',
  
  execute: async (input, groqClient) => {
    const { equipmentIds, metric } = input;

    const [eq1, eq2] = await Promise.all(
      equipmentIds.map(id => Equipment.findByPk(id))
    );

    if (!eq1 || !eq2) throw new Error('One or both equipment not found');

    const [data1, data2] = await Promise.all(
      equipmentIds.map(id => getHistoricalAverage(id))
    );

    const prompt = PROMPTS.COMPARE_EQUIPMENT
      .replace('{equipment1Data}', JSON.stringify({ name: eq1.name, ...data1?.avg }, null, 2))
      .replace('{equipment2Data}', JSON.stringify({ name: eq2.name, ...data2?.avg }, null, 2))
      .replace('{metric}', metric || 'overall efficiency');

    const response = await callLLM(prompt, groqClient);
    const parsed = parseJSONResponse(response);

    return {
      success: true,
      equipment1: eq1.name,
      equipment2: eq2.name,
      comparison: parsed || {}
    };
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// HERRAMIENTA 6: Resumen Ejecutivo
// ═════════════════════════════════════════════════════════════════════════════

const executiveSummaryTool = {
  name: 'create_summary',
  description: 'Crea resumen ejecutivo del período',
  
  execute: async (input, groqClient) => {
    const { period = 'month' } = input;

    const since = new Date();
    if (period === 'month') since.setMonth(since.getMonth() - 1);
    else if (period === 'quarter') since.setMonth(since.getMonth() - 3);
    else if (period === 'year') since.setFullYear(since.getFullYear() - 1);

    const reports = await ServiceReport.findAll({
      where: { createdAt: { [sequelize.Op.gte]: since } },
      include: [{ model: Equipment, as: 'equipment' }]
    });

    const reportsText = reports
      .map(r => `${r.reportDate}: ${r.description || r.observations}`)
      .join('\n');

    const prompt = PROMPTS.EXECUTIVE_SUMMARY
      .replace('{periodData}', `Period: ${period}, Reports: ${reports.length}`)
      .replace('{allReports}', reportsText || 'No reports');

    const response = await callLLM(prompt, groqClient);
    const parsed = parseJSONResponse(response);

    return {
      success: true,
      period,
      summary: parsed || { executiveSummary: response }
    };
  }
};

module.exports = {
  generateReportTool,
  askEquipmentTool,
  detectAnomalyTool,
  recommendMaintenanceTool,
  compareEquipmentTool,
  executiveSummaryTool,
  callLLM,
  parseJSONResponse
};
