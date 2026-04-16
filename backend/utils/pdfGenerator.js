'use strict';

const PDFDocument = require('pdfkit');

/**
 * Generates an insurance contract PDF as a Buffer (never touches disk).
 *
 * @param {Object} contractData
 * @param {string} contractData.policy_reference   e.g. "RSA-20260415-000005"
 * @param {string} contractData.client_name        e.g. "Aida Moufouki"
 * @param {string} contractData.product_name       e.g. "Roadside Assistance" | "Natural Disaster (CATNAT)"
 * @param {string|Date} contractData.start_date    e.g. "2026-04-15"
 * @param {string|Date} contractData.end_date      e.g. "2027-04-14"
 * @param {number|string} contractData.amount      e.g. 4900.00
 * @returns {Promise<Buffer>}
 */
function createContractPDF(contractData) {
  return new Promise((resolve, reject) => {
    const {
      policy_reference,
      client_name,
      product_name,
      start_date,
      end_date,
      amount,
    } = contractData;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ─── COLORS & HELPERS ───────────────────────────────────────────────────
    const BLUE   = '#003D7A';   // CAAR brand blue
    const GOLD   = '#C8A951';   // accent
    const GRAY   = '#555555';
    const LIGHT  = '#F4F6F9';

    const fmt = (val) =>
      val instanceof Date
        ? val.toLocaleDateString('fr-DZ')
        : String(val ?? '—');

    const fmtAmount = (val) =>
      Number(val).toLocaleString('fr-DZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' DZD';

    // ─── HEADER BAND ────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 100).fill(BLUE);

    doc
      .fillColor('#FFFFFF')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('CAAR Insurance', 50, 28, { align: 'left' });

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor(GOLD)
      .text('Compagnie Algérienne des Assurances et de Réassurance', 50, 56, {
        align: 'left',
      });

    // Right side: title
    doc
      .fillColor('#FFFFFF')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('INSURANCE CONTRACT', 0, 40, { align: 'right', width: doc.page.width - 50 });

    // ─── GOLD SEPARATOR ─────────────────────────────────────────────────────
    doc.moveDown(0);
    doc.rect(50, 110, doc.page.width - 100, 3).fill(GOLD);

    // ─── BODY SECTION ───────────────────────────────────────────────────────
    const bodyTop = 130;

    // Light background card
    doc
      .rect(50, bodyTop, doc.page.width - 100, 230)
      .fill(LIGHT);

    const labelX  = 70;
    const valueX  = 260;
    const rowH    = 34;

    const rows = [
      { label: 'Policy Reference',  value: fmt(policy_reference) },
      { label: 'Client Name',       value: fmt(client_name)      },
      { label: 'Product',           value: fmt(product_name)     },
      { label: 'Start Date',        value: fmt(start_date)       },
      { label: 'End Date',          value: fmt(end_date)         },
      { label: 'Premium Amount',    value: fmtAmount(amount)     },
    ];

    rows.forEach((row, i) => {
      const y = bodyTop + 20 + i * rowH;

      // Alternating row tint
      if (i % 2 === 0) {
        doc.rect(51, y - 5, doc.page.width - 102, rowH - 2).fill('#E8EDF4');
      }

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(BLUE)
        .text(row.label, labelX, y, { width: valueX - labelX - 10 });

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(GRAY)
        .text(row.value, valueX, y, { width: doc.page.width - valueX - 60 });
    });

    // ─── BOTTOM ACCENT LINE ─────────────────────────────────────────────────
    const afterBody = bodyTop + 240;
    doc.rect(50, afterBody, doc.page.width - 100, 2).fill(BLUE);

    // ─── VALIDITY NOTE ──────────────────────────────────────────────────────
    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor(GRAY)
      .text(
        'This contract is valid for the period indicated above. Please keep this document safe.',
        50,
        afterBody + 12,
        { align: 'center', width: doc.page.width - 100 }
      );

    // ─── FOOTER ─────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 55;
    doc.rect(0, footerY - 10, doc.page.width, 65).fill(BLUE);

    doc
      .fillColor('#FFFFFF')
      .font('Helvetica')
      .fontSize(8)
      .text(
        'This document is generated automatically',
        50,
        footerY,
        { align: 'center', width: doc.page.width - 100 }
      );

    doc
      .fillColor(GOLD)
      .fontSize(7)
      .text(
        `Generated on: ${new Date().toLocaleString('fr-DZ')}  |  CAAR Insurance — www.caar.dz`,
        50,
        footerY + 16,
        { align: 'center', width: doc.page.width - 100 }
      );

    doc.end();
  });
}

module.exports = { createContractPDF };