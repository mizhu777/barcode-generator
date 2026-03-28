/**
 * 条形码生成器 - 主逻辑
 */

(function() {
  'use strict';

  const {
    normalizeRows,
    getPreviewCountLabel,
    createPdfRenderConfig,
    getBarcodeLayoutOffsets
  } = window.BarcodeCore;

  let excelData = [];

  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const previewSection = document.getElementById('previewSection');
  const pdfPreviewImage = document.getElementById('pdfPreviewImage');
  const previewCount = document.getElementById('previewCount');
  const settingsSection = document.getElementById('settingsSection');
  const actionSection = document.getElementById('actionSection');
  const generateBtn = document.getElementById('generateBtn');
  const columnsGroup = document.getElementById('columnsGroup');

  function init() {
    setupEventListeners();
  }

  function setupEventListeners() {
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    generateBtn.addEventListener('click', generatePDF);
    columnsGroup.addEventListener('change', handleColumnsChange);
  }

  function handleColumnsChange() {
    if (excelData.length > 0) {
      renderPreview();
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
  }

  function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
  }

  function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function processFile(file) {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    const extension = file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(file.type) && !['xlsx', 'xls', 'csv'].includes(extension)) {
      alert('请上传 Excel 或 CSV 文件（.xlsx、.xls、.csv）');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        parseExcel(event.target.result, file.name);
      } catch (error) {
        alert('解析文件失败：' + error.message);
      }
    };
    reader.onerror = function() {
      alert('读取文件失败');
    };
    reader.readAsArrayBuffer(file);
  }

  function parseExcel(data, fileName) {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

    excelData = normalizeRows(rows);

    if (excelData.length === 0) {
      alert('文件中没有找到有效数据（需要编码和品名两列）');
      return;
    }

    fileInfo.textContent = `已加载：${fileName}，共 ${excelData.length} 条数据`;
    fileInfo.style.display = 'block';
    fileInput.value = '';

    renderPreview();
    previewSection.style.display = 'block';
    settingsSection.style.display = 'block';
    actionSection.style.display = 'block';
  }

  function renderPreview() {
    previewCount.textContent = getPreviewCountLabel(excelData.length);
    renderPdfPreview();
  }

  function getColumnsCount() {
    const selected = columnsGroup.querySelector('input[name="columns"]:checked');
    return selected ? Number.parseInt(selected.value, 10) : 5;
  }

  function fillWhite(context, width, height) {
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);
  }

  function createDrawState(config) {
    const layout = getBarcodeLayoutOffsets(config);
    const barcodeCanvas = document.createElement('canvas');
    barcodeCanvas.width = Math.max(480, Math.round(config.canvasItemWidth));
    barcodeCanvas.height = Math.max(160, config.barcodeDrawHeight + 40);
    const barcodeCtx = barcodeCanvas.getContext('2d');

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = config.pageWidthPx;
    pageCanvas.height = config.pageHeightPx;
    const pageCtx = pageCanvas.getContext('2d');
    pageCtx.textAlign = 'center';
    pageCtx.textBaseline = 'alphabetic';

    return {
      layout,
      barcodeCanvas,
      barcodeCtx,
      pageCanvas,
      pageCtx
    };
  }

  function drawItem(pageCtx, barcodeCtx, barcodeCanvas, config, layout, item, col, rowOnPage) {
    const x = Math.round((config.margin + col * (config.itemWidth + config.columnGapMm)) * config.pxPerMm);
    const y = Math.round((config.margin + rowOnPage * config.itemHeight) * config.pxPerMm);

    const nameBasePx = Math.round(11 * config.pxPerMm / 3);
    const nameMinPx = Math.round(7 * config.pxPerMm / 3);
    const codeBasePx = Math.round(9 * config.pxPerMm / 3);
    const codeFallbackPx = Math.round(8 * config.pxPerMm / 3);
    const textMaxWidth = Math.max(40, config.canvasItemWidth - 24);

    pageCtx.fillStyle = '#000000';
    setFittedTextFont(
      pageCtx,
      item.name,
      textMaxWidth,
      nameBasePx,
      nameMinPx,
      'bold'
    );
    pageCtx.fillText(item.name, x + config.canvasItemWidth / 2, y + layout.nameTextY);

    try {
      fillWhite(barcodeCtx, barcodeCanvas.width, barcodeCanvas.height);
      JsBarcode(barcodeCanvas, item.code, {
        format: 'CODE128',
        width: 3,
        height: Math.round(config.barcodeDrawHeight * 0.8),
        displayValue: false,
        margin: 0,
        background: '#FFFFFF',
        lineColor: '#000000'
      });

      const barcodeImgWidth = Math.max(40, config.canvasItemWidth - 24);
      pageCtx.drawImage(
        barcodeCanvas,
        0,
        0,
        barcodeCanvas.width,
        barcodeCanvas.height,
        x + 12,
        y + layout.barcodeTop,
        barcodeImgWidth,
        config.barcodeDrawHeight
      );
    } catch (error) {
      pageCtx.font = `normal ${codeFallbackPx}px "Microsoft YaHei", "PingFang SC", sans-serif`;
      pageCtx.fillStyle = '#666666';
      pageCtx.fillText(item.code, x + config.canvasItemWidth / 2, y + layout.fallbackCodeY);
    }

    pageCtx.font = `normal ${codeBasePx}px "Microsoft YaHei", "PingFang SC", sans-serif`;
    pageCtx.fillStyle = '#000000';
    pageCtx.fillText(item.code, x + config.canvasItemWidth / 2, y + layout.codeTextY);
  }

  function setFittedTextFont(context, text, maxWidth, startPx, minPx, weight) {
    let fontPx = startPx;
    while (fontPx > minPx) {
      context.font = `${weight} ${fontPx}px "Microsoft YaHei", "PingFang SC", sans-serif`;
      if (context.measureText(text).width <= maxWidth) {
        return;
      }
      fontPx -= 1;
    }
    context.font = `${weight} ${minPx}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  }

  function renderPage(excelRows, startIndex, config, drawState, columns) {
    const pageSize = config.rowsPerPage * columns;
    const endIndex = Math.min(startIndex + pageSize, excelRows.length);

    fillWhite(drawState.pageCtx, config.pageWidthPx, config.pageHeightPx);

    for (let index = startIndex; index < endIndex; index += 1) {
      const localIndex = index - startIndex;
      const col = localIndex % columns;
      const rowOnPage = Math.floor(localIndex / columns);
      drawItem(
        drawState.pageCtx,
        drawState.barcodeCtx,
        drawState.barcodeCanvas,
        config,
        drawState.layout,
        excelRows[index],
        col,
        rowOnPage
      );
    }
  }

  function renderPdfPreview() {
    const columns = getColumnsCount();
    const config = createPdfRenderConfig(columns);
    const drawState = createDrawState(config);
    renderPage(excelData, 0, config, drawState, columns);
    pdfPreviewImage.src = drawState.pageCanvas.toDataURL('image/png');
  }

  function drawPage(pdf, pageCanvas, config) {
    const pageDataUrl = pageCanvas.toDataURL('image/png');
    pdf.addImage(pageDataUrl, 'PNG', 0, 0, config.pageWidth, config.pageHeight, undefined, 'FAST');
  }

  function generatePDF() {
    const columns = getColumnsCount();
    const config = createPdfRenderConfig(columns);
    const drawState = createDrawState(config);
    const pageSize = config.rowsPerPage * columns;

    const pdf = new window.jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let startIndex = 0; startIndex < excelData.length; startIndex += pageSize) {
      renderPage(excelData, startIndex, config, drawState, columns);
      drawPage(pdf, drawState.pageCanvas, config);
      if (startIndex + pageSize < excelData.length) {
        pdf.addPage();
      }
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    pdf.save(`条形码-${timestamp}.pdf`);
  }

  init();
})();
