const PDFDocument = require('pdfkit');
const { ServiceReport, Equipment, Client, User } = require('../models');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseJSON = (v) => {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return null; }
};

const fmt = (v, suffix = '') =>
  v !== undefined && v !== null && v !== '' ? `${v}${suffix}` : '—';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
};

// ─── Colors / Design tokens ───────────────────────────────────────────────────
const C = {
  primary:    '#1e3a5f',   // dark navy
  accent:     '#2563eb',   // blue
  lightBlue:  '#dbeafe',
  green:      '#166534',
  lightGreen: '#dcfce7',
  orange:     '#9a3412',
  lightOrange:'#ffedd5',
  gray:       '#64748b',
  lightGray:  '#f1f5f9',
  border:     '#cbd5e1',
  text:       '#1e293b',
  white:      '#ffffff',
};

// ─── Drawing helpers ──────────────────────────────────────────────────────────

const sectionHeader = (doc, text, color = C.primary, bgColor = C.lightBlue) => {
  const y = doc.y;
  doc.rect(doc.page.margins.left, y, pageWidth(doc), 20)
     .fill(bgColor);
  doc.fillColor(color)
     .fontSize(9)
     .font('Helvetica-Bold')
     .text(text.toUpperCase(), doc.page.margins.left + 6, y + 5, { width: pageWidth(doc) });
  doc.fillColor(C.text).font('Helvetica');
  doc.y = y + 24;
};

const fieldRow = (doc, label, value, x, y, labelW = 90, fieldW = 110) => {
  doc.fontSize(7).font('Helvetica-Bold').fillColor(C.gray)
     .text(label, x, y, { width: labelW });
  doc.fontSize(8).font('Helvetica').fillColor(C.text)
     .text(fmt(value), x + labelW, y, { width: fieldW });
};

const cell = (doc, text, x, y, w, h, opts = {}) => {
  const bg = opts.bg || C.white;
  const border = opts.border !== false;
  if (bg !== C.white) doc.rect(x, y, w, h).fill(bg);
  if (border) doc.rect(x, y, w, h).stroke(C.border);
  doc.fillColor(opts.color || C.text)
     .fontSize(opts.fontSize || 8)
     .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
     .text(String(text ?? '—'), x + 3, y + 3, { width: w - 6, height: h - 3, ellipsis: true });
};

const pageWidth = (doc) =>
  doc.page.width - doc.page.margins.left - doc.page.margins.right;

// ─── PDF builder ──────────────────────────────────────────────────────────────

const buildReportPDF = async (reportId) => {
  const report = await ServiceReport.findByPk(reportId, {
    include: [
      { model: Equipment, as: 'equipment', include: [{ model: Client, as: 'client' }] },
      { model: User,      as: 'technician', attributes: ['id', 'username', 'email'] }
    ]
  });

  if (!report) throw new Error('Reporte no encontrado');

  const we  = parseJSON(report.waterEnergyData)  || {};
  const motors = parseJSON(report.motorsData)     || [];
  const ctrl   = parseJSON(report.controlData)    || {};

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    info: {
      Title: `Reporte ${report.reportNumber}`,
      Author: 'Hidrobombas Mérida',
      Subject: 'Reporte de Mantenimiento'
    }
  });

  const pw = pageWidth(doc);

  // ════════════════════════════════════════════════════════════════════════════
  // HEADER
  // ════════════════════════════════════════════════════════════════════════════
  doc.rect(40, 40, pw, 65).fill(C.primary);

  // Company name
  doc.fillColor(C.white).fontSize(16).font('Helvetica-Bold')
     .text('HIDROBOMBAS MÉRIDA', 50, 50, { width: pw - 160 });
  doc.fontSize(8).font('Helvetica').fillColor('#93c5fd')
     .text('Servicio Técnico Especializado en Sistemas de Bombeo', 50, 68);
  doc.fillColor('#bfdbfe').fontSize(7)
     .text('RIF: J-XXXXXXXXX-X  •  Tel: +58 274 XXX-XXXX  •  hidrobombasmerida@gmail.com', 50, 80);

  // Report number box
  doc.rect(pw - 110, 45, 145, 52).fill('#1e40af');
  doc.fillColor(C.white).fontSize(7).font('Helvetica-Bold')
     .text('N° DE REPORTE', pw - 107, 50, { width: 138, align: 'center' });
  doc.fontSize(14).font('Helvetica-Bold')
     .text(report.reportNumber || '—', pw - 107, 62, { width: 138, align: 'center' });
  doc.fontSize(7).font('Helvetica')
     .text(fmtDate(report.reportDate), pw - 107, 80, { width: 138, align: 'center' });

  doc.fillColor(C.text);
  doc.y = 120;

  // ════════════════════════════════════════════════════════════════════════════
  // TITLE BAR
  // ════════════════════════════════════════════════════════════════════════════
  const visitLabels = { mensual: 'MANTENIMIENTO MENSUAL', eventual: 'VISITA EVENTUAL', technical: 'SERVICIO TÉCNICO' };
  const visitColors = { mensual: '#166534', eventual: '#9a3412', technical: '#1e40af' };
  const visitBg     = { mensual: '#dcfce7',  eventual: '#ffedd5',  technical: '#dbeafe' };
  const vt = report.visitType || 'mensual';

  doc.rect(40, doc.y, pw, 18).fill(visitBg[vt] || C.lightBlue);
  doc.fillColor(visitColors[vt] || C.primary).fontSize(10).font('Helvetica-Bold')
     .text(visitLabels[vt] || vt.toUpperCase(), 40, doc.y + 4, { width: pw, align: 'center' });
  doc.y += 26;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 1 — INFORMACIÓN GENERAL
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader(doc, '1. Información General', C.primary, C.lightBlue);

  const infoY = doc.y;
  const col1 = 40, col2 = 40 + pw / 2 + 5;
  const colW = pw / 2 - 5;

  // Left column
  fieldRow(doc, 'Cliente:', report.equipment?.client?.name, col1, infoY);
  fieldRow(doc, 'Equipo:', report.equipment?.name, col1, infoY + 14);
  fieldRow(doc, 'Serie:', report.equipment?.serialNumber, col1, infoY + 28);

  // Right column
  fieldRow(doc, 'Sistema:', report.systemName, col2, infoY);
  fieldRow(doc, 'Técnico:', report.technicianName || report.technician?.username, col2, infoY + 14);
  fieldRow(doc, 'Ubicación:', report.equipment?.location || '—', col2, infoY + 28);

  doc.y = infoY + 46;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — VOLTAJE DE RED
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader(doc, '2. Voltaje de Red (V) y Estado del Sistema', C.primary, C.lightBlue);

  const voltY = doc.y;
  const voltHeaders = ['R-S', 'R-N', 'S-T', 'S-N', 'T-R', 'T-N', 'Vmin', 'Vmax'];
  const voltKeys    = ['voltage_r_s','voltage_r_n','voltage_s_t','voltage_s_n','voltage_t_r','voltage_t_n','volts_min','volts_max'];
  const cw = pw / voltHeaders.length;

  voltHeaders.forEach((h, i) => {
    cell(doc, h, 40 + i * cw, voltY, cw, 14, { bg: C.primary, color: C.white, bold: true, fontSize: 7 });
  });
  voltKeys.forEach((k, i) => {
    cell(doc, fmt(we[k], ' V'), 40 + i * cw, voltY + 14, cw, 14, { fontSize: 8 });
  });

  doc.y = voltY + 34;

  // Water level row
  const wlY = doc.y;
  const wlItems = [
    ['Nivel de Agua', we.water_level],
    ['Contacto Flotante NA 1', we.float_contact_na],
    ['Contacto Flotante NA 2', we.float_contact_na_2],
    ['LED Tanque Vacío',       we.led_empty_tank],
    ['Tiempo 1 (min)',         we.time_1],
    ['Tiempo 2 (min)',         we.time_2],
  ];
  const wlCw = pw / wlItems.length;
  wlItems.forEach(([label, val], i) => {
    cell(doc, label, 40 + i * wlCw, wlY, wlCw, 12, { bg: C.lightGray, bold: true, fontSize: 6 });
    cell(doc, fmt(val), 40 + i * wlCw, wlY + 12, wlCw, 14, { fontSize: 8 });
  });

  doc.y = wlY + 32;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 3 — MOTORES
  // ════════════════════════════════════════════════════════════════════════════
  if (motors.length > 0) {
    sectionHeader(doc, '3. Datos de Motores', C.primary, C.lightBlue);

    const motorCols = [
      { label: 'HP',         key: 'motor_hp',         w: 35 },
      { label: 'In (A)',     key: 'amperage',          w: 40 },
      { label: 'Fase R (A)', key: 'phase_r',           w: 42 },
      { label: 'Fase S (A)', key: 'phase_s',           w: 42 },
      { label: 'Fase T (A)', key: 'phase_t',           w: 42 },
      { label: 'Bobina',     key: 'bobina_value',      w: 42 },
      { label: 'Contactos',  key: 'contactos_value',   w: 42 },
      { label: 'T°Motor',    key: 'motor_temp',        w: 42 },
      { label: 'T°Voluta',   key: 'voluta_temp',       w: 42 },
      { label: 'T°Relé',     key: 'thermal_temp',      w: 42 },
      { label: 'Relé (A)',   key: 'thermal_amp',       w: 42 },
    ];

    const mhY = doc.y;

    // Motor number col header
    cell(doc, 'MOTOR', 40, mhY, 35, 14, { bg: C.primary, color: C.white, bold: true, fontSize: 7 });
    let xOff = 40 + 35;
    motorCols.forEach(c => {
      cell(doc, c.label, xOff, mhY, c.w, 14, { bg: C.primary, color: C.white, bold: true, fontSize: 6 });
      xOff += c.w;
    });

    motors.forEach((motor, idx) => {
      const rowY = mhY + 14 + idx * 16;
      const rowBg = idx % 2 === 0 ? C.white : C.lightGray;
      cell(doc, `Motor ${idx + 1}`, 40, rowY, 35, 16, { bg: '#eff6ff', bold: true, fontSize: 7 });
      let x = 40 + 35;
      motorCols.forEach(c => {
        let val = motor[c.key];
        if (c.key === 'motor_temp' || c.key === 'voluta_temp' || c.key === 'thermal_temp') {
          val = val ? `${val}°C` : '—';
        } else {
          val = fmt(val);
        }
        cell(doc, val, x, rowY, c.w, 16, { bg: rowBg, fontSize: 8 });
        x += c.w;
      });
    });

    doc.y = mhY + 14 + motors.length * 16 + 8;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 4 — CONTROL Y PERIFÉRICOS
  // ════════════════════════════════════════════════════════════════════════════
  if (Object.keys(ctrl).length > 0) {
    sectionHeader(doc, '4. Control y Periféricos', C.primary, C.lightBlue);

    const ctrlY = doc.y;

    // Breakers row
    const breakers = [
      ['Breaker Trip. 1', ctrl.breaker_tripolar_1],
      ['Breaker Trip. 2', ctrl.breaker_tripolar_2],
      ['Breaker Trip. 3', ctrl.breaker_tripolar_3],
      ['Breaker Control', ctrl.breaker_control],
      ['Relé Alternador', ctrl.relay_alternator],
      ['Relé Ctrl/Nivel', ctrl.relay_control_level],
    ];
    const bcw = pw / breakers.length;
    breakers.forEach(([label, val], i) => {
      cell(doc, label, 40 + i * bcw, ctrlY, bcw, 12, { bg: C.lightGray, bold: true, fontSize: 6 });
      const isOK = String(val).toUpperCase() === 'OK';
      cell(doc, fmt(val), 40 + i * bcw, ctrlY + 12, bcw, 14,
        { fontSize: 8, color: isOK ? '#166534' : C.text, bold: isOK });
    });

    doc.y = ctrlY + 32;

    // Pressures
    const presY = doc.y;
    const presItems = [
      ['Manómetro (PSI)', ctrl.manometer],
      ['Presión On (PSI)', ctrl.pressure_on],
      ['Presión Off (PSI)', ctrl.pressure_off],
      ['Comp. Aceite', ctrl.compressor_oil],
      ['Comp. Correa', ctrl.compressor_belt],
    ];
    const pcw = pw / presItems.length;
    presItems.forEach(([label, val], i) => {
      cell(doc, label, 40 + i * pcw, presY, pcw, 12, { bg: C.lightGray, bold: true, fontSize: 6 });
      cell(doc, fmt(val), 40 + i * pcw, presY + 12, pcw, 14, { fontSize: 8 });
    });

    doc.y = presY + 32;

    // Pump cycles — up to 3 pumps
    const pumps = [1, 2, 3].filter(n =>
      ctrl[`pump_${n}_on_minutes`] || ctrl[`pump_${n}_rest_minutes`] || ctrl[`pump_${n}_noise_db`]
    );
    if (pumps.length > 0) {
      const pumpY = doc.y;
      const pumpCols = ['Bomba', 'Tiempo ON (min)', 'Tiempo Descanso (min)', 'Ruido (dB)'];
      const pumpW    = [50, (pw - 50) / 3, (pw - 50) / 3, (pw - 50) / 3];
      pumpCols.forEach((h, i) => {
        const x = 40 + pumpW.slice(0, i).reduce((a, b) => a + b, 0);
        cell(doc, h, x, pumpY, pumpW[i], 12, { bg: C.primary, color: C.white, bold: true, fontSize: 6 });
      });
      pumps.forEach((n, idx) => {
        const rowY = pumpY + 12 + idx * 14;
        const vals = [
          `Bomba ${n}`,
          fmt(ctrl[`pump_${n}_on_minutes`], ' min'),
          fmt(ctrl[`pump_${n}_rest_minutes`], ' min'),
          fmt(ctrl[`pump_${n}_noise_db`], ' dB'),
        ];
        vals.forEach((v, i) => {
          const x = 40 + pumpW.slice(0, i).reduce((a, b) => a + b, 0);
          cell(doc, v, x, rowY, pumpW[i], 14, { bg: idx % 2 === 0 ? C.white : C.lightGray, fontSize: 8 });
        });
      });
      doc.y = pumpY + 12 + pumps.length * 14 + 8;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 5 — OBSERVACIONES
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader(doc, '5. Observaciones Técnicas', C.primary, C.lightBlue);

  const obsText = report.observations || report.description || 'Sin observaciones registradas.';
  const obsY = doc.y;
  doc.rect(40, obsY, pw, 50).stroke(C.border);
  doc.fontSize(8).font('Helvetica').fillColor(C.text)
     .text(obsText, 46, obsY + 5, { width: pw - 12, height: 42 });
  doc.y = obsY + 58;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 6 — FIRMAS
  // ════════════════════════════════════════════════════════════════════════════
  sectionHeader(doc, '6. Firmas de Conformidad', C.primary, C.lightBlue);

  const sigY   = doc.y;
  const sigW   = (pw - 20) / 2;
  const sigH   = 55;

  // Technician signature box
  doc.rect(40, sigY, sigW, sigH).stroke(C.border);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(C.gray)
     .text('TÉCNICO — HIDROBOMBAS MÉRIDA', 46, sigY + 5, { width: sigW - 12 });
  // Signature line
  doc.moveTo(55, sigY + 38).lineTo(40 + sigW - 15, sigY + 38).stroke(C.border);
  doc.fontSize(8).font('Helvetica').fillColor(C.text)
     .text(report.technicianName || report.technician?.username || '___________________', 46, sigY + 42, { width: sigW - 12 });

  // Client signature box
  const sig2X = 40 + sigW + 20;
  doc.rect(sig2X, sigY, sigW, sigH).stroke(C.border);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(C.gray)
     .text('CLIENTE', sig2X + 6, sigY + 5, { width: sigW - 12 });
  doc.moveTo(sig2X + 15, sigY + 38).lineTo(sig2X + sigW - 15, sigY + 38).stroke(C.border);
  doc.fontSize(8).font('Helvetica').fillColor(C.text)
     .text(report.clientSignatureName || '___________________', sig2X + 6, sigY + 42, { width: sigW - 12 });

  doc.y = sigY + sigH + 16;

  // ════════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ════════════════════════════════════════════════════════════════════════════
  const footerY = doc.page.height - 35;
  doc.rect(40, footerY, pw, 0.5).fill(C.border);
  doc.fontSize(7).font('Helvetica').fillColor(C.gray)
     .text(
       `Generado el ${new Date().toLocaleString('es-ES')}  •  ${report.reportNumber}  •  Hidrobombas Mérida`,
       40, footerY + 4, { width: pw, align: 'center' }
     );

  doc.end();
  return doc;
};

module.exports = { buildReportPDF };
