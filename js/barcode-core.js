(function(globalScope) {
  'use strict';

  const HEADER_ALIASES = {
    code: ['编码', '编号', 'code', 'id'],
    name: ['品名', '名称', 'name']
  };

  function normalizeCell(value) {
    return String(value ?? '').trim();
  }

  function isHeaderCell(value, aliases) {
    return aliases.includes(normalizeCell(value).toLowerCase());
  }

  function hasHeaderRow(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return false;
    }

    const [firstCode, firstName] = rows[0];
    return isHeaderCell(firstCode, HEADER_ALIASES.code)
      && isHeaderCell(firstName, HEADER_ALIASES.name);
  }

  function normalizeRows(rows) {
    const sourceRows = hasHeaderRow(rows) ? rows.slice(1) : rows;

    return sourceRows
      .filter((row) => Array.isArray(row) && row.length >= 2)
      .map((row) => ({
        code: normalizeCell(row[0]),
        name: normalizeCell(row[1])
      }))
      .filter((row) => row.code && row.name);
  }

  function getPreviewCountLabel(total, previewLimit = 5) {
    return total > previewLimit
      ? `共 ${total} 条，显示前 ${previewLimit} 条`
      : `共 ${total} 条`;
  }

  function createPdfRenderConfig(columns) {
    const dpi = 300;
    const pxPerMm = dpi / 25.4;
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const columnGapMm = 3;
    const itemWidth = (contentWidth - columnGapMm * (columns - 1)) / columns;
    const itemHeight = 30;
    const barcodeHeight = 11;
    const rowsPerPage = Math.floor(contentHeight / itemHeight);

    return {
      dpi,
      pxPerMm,
      pageWidth,
      pageHeight,
      margin,
      contentWidth,
      contentHeight,
      itemWidth,
      columnGapMm,
      itemHeight,
      barcodeHeight,
      rowsPerPage,
      canvasItemWidth: Math.round(itemWidth * pxPerMm),
      barcodeDrawHeight: Math.round(barcodeHeight * pxPerMm),
      pageWidthPx: Math.round(pageWidth * pxPerMm),
      pageHeightPx: Math.round(pageHeight * pxPerMm)
    };
  }

  function getBarcodeLayoutOffsets(config) {
    const nameTextY = Math.round(3.0 * config.pxPerMm);
    const barcodeTop = Math.round(4.4 * config.pxPerMm);
    const barcodeToCodeGap = Math.round(2.8 * config.pxPerMm);

    return {
      nameTextY,
      barcodeTop,
      codeTextY: barcodeTop + config.barcodeDrawHeight + barcodeToCodeGap,
      fallbackCodeY: barcodeTop + Math.round(3.6 * config.pxPerMm)
    };
  }

  const api = {
    normalizeRows,
    getPreviewCountLabel,
    createPdfRenderConfig,
    getBarcodeLayoutOffsets
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.BarcodeCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
