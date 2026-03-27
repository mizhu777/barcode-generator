/**
 * 条形码生成器 - 主逻辑
 */

(function() {
    'use strict';

    // 状态
    let excelData = [];

    // DOM 元素
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const previewSection = document.getElementById('previewSection');
    const previewBody = document.getElementById('previewBody');
    const previewCount = document.getElementById('previewCount');
    const settingsSection = document.getElementById('settingsSection');
    const actionSection = document.getElementById('actionSection');
    const generateBtn = document.getElementById('generateBtn');
    const columnsGroup = document.getElementById('columnsGroup');

    // 初始化
    function init() {
        setupEventListeners();
    }

    // 事件绑定
    function setupEventListeners() {
        // 点击上传
        uploadArea.addEventListener('click', () => fileInput.click());

        // 文件选择
        fileInput.addEventListener('change', handleFileSelect);

        // 拖拽上传
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);

        // 生成按钮
        generateBtn.addEventListener('click', generatePDF);
    }

    // 拖拽处理
    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }

    // 文件选择处理
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }

    // 处理文件
    function processFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        const extension = file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(file.type) && !['xlsx', 'xls', 'csv'].includes(extension)) {
            alert('请上传 Excel 文件 (.xlsx 或 .xls)');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                parseExcel(e.target.result, file.name);
            } catch (err) {
                alert('解析 Excel 文件失败：' + err.message);
            }
        };
        reader.onerror = function() {
            alert('读取文件失败');
        };
        reader.readAsArrayBuffer(file);
    }

    // 解析 Excel
    function parseExcel(data, fileName) {
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        excelData = jsonData
            .filter(row => row.length >= 2 && row[0] && row[1])
            .map(row => ({
                code: String(row[0]).trim(),
                name: String(row[1]).trim()
            }));

        if (excelData.length === 0) {
            alert('Excel 文件中没有找到有效数据（需要编码和品名两列）');
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

    // 渲染预览
    function renderPreview() {
        previewBody.innerHTML = '';
        const previewRows = excelData.slice(0, 5);

        previewRows.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${idx + 1}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.name)}</td>`;
            previewBody.appendChild(tr);
        });

        const total = excelData.length;
        const display = total > 5 ? `共 ${total} 条，显示前 5 条` : `共 ${total} 条`;
        previewCount.textContent = display;
    }

    // HTML 转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 获取每行数量设置
    function getColumnsCount() {
        const radios = columnsGroup.querySelectorAll('input[name="columns"]');
        for (const radio of radios) {
            if (radio.checked) {
                return parseInt(radio.value, 10);
            }
        }
        return 5;
    }

    // 填充画布白色背景
    function fillWhite(ctx, width, height) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
    }

    // 生成 PDF
    function generatePDF() {
        const columns = getColumnsCount();

        // A4 尺寸（mm）
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;

        // 可用区域
        const contentWidth = pageWidth - margin * 2;
        const contentHeight = pageHeight - margin * 2;

        // 每个条形码单元的尺寸 (mm)
        const itemWidth = contentWidth / columns;
        const itemHeight = 30; // 每行高度（mm）
        const barcodeHeight = 18; // 条形码高度

        // 转换为像素 (1mm ≈ 3.78px at 96dpi)
        const pxPerMm = 3.78;
        const canvasItemWidth = itemWidth * pxPerMm;
        const canvasBarcodeHeight = barcodeHeight * pxPerMm;

        // 计算每页行数
        const rowsPerPage = Math.floor(contentHeight / itemHeight);

        // 创建 PDF
        const pdf = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // 当前页和位置
        let currentPage = 0;
        let currentRow = 0;

        // 创建条形码 canvas
        const barcodeCanvas = document.createElement('canvas');
        barcodeCanvas.width = 300;
        barcodeCanvas.height = 60;
        const barcodeCtx = barcodeCanvas.getContext('2d');

        // 创建页面 canvas
        const pageCanvas = document.createElement('canvas');
        const pageWidthPx = Math.round(pageWidth * pxPerMm);
        const pageHeightPx = Math.round(pageHeight * pxPerMm);
        pageCanvas.width = pageWidthPx;
        pageCanvas.height = pageHeightPx;
        const pageCtx = pageCanvas.getContext('2d');

        // 初始化第一页画布（白色背景）
        fillWhite(pageCtx, pageWidthPx, pageHeightPx);

        excelData.forEach((item, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);

            // 检查是否需要新页
            if (row >= (currentPage + 1) * rowsPerPage) {
                // 把当前页 canvas 添加到 PDF
                const pageDataUrl = pageCanvas.toDataURL('image/png');
                pdf.addImage(pageDataUrl, 'PNG', 0, 0, pageWidth, pageHeight);

                currentPage++;
                currentRow = currentPage * rowsPerPage;
                pdf.addPage();

                // 重置画布（白色背景）
                fillWhite(pageCtx, pageWidthPx, pageHeightPx);
            }

            // 计算在页面 canvas 上的位置
            const x = (margin + col * itemWidth) * pxPerMm;
            const y = (margin + (row - currentRow) * itemHeight) * pxPerMm;

            // 绘制品名（上方）
            pageCtx.fillStyle = '#000000';
            pageCtx.font = 'bold 11px "Microsoft YaHei", "PingFang SC", sans-serif';
            pageCtx.textAlign = 'center';
            pageCtx.fillText(item.name, x + canvasItemWidth / 2, y + 12);

            // 绘制条形码
            try {
                fillWhite(barcodeCtx, barcodeCanvas.width, barcodeCanvas.height);

                JsBarcode(barcodeCanvas, item.code, {
                    format: 'CODE128',
                    width: 1.5,
                    height: 45,
                    displayValue: false,
                    margin: 0
                });

                pageCtx.drawImage(
                    barcodeCanvas,
                    0, 0, barcodeCanvas.width, barcodeCanvas.height,
                    x + 6, y + 15, canvasItemWidth - 12, canvasBarcodeHeight
                );
            } catch (e) {
                // 条形码失败时显示编码
                pageCtx.font = '8px "Microsoft YaHei", "PingFang SC", sans-serif';
                pageCtx.fillStyle = '#666666';
                pageCtx.fillText(item.code, x + canvasItemWidth / 2, y + 25);
            }

            // 绘制编码（下方）
            pageCtx.font = '9px "Microsoft YaHei", "PingFang SC", sans-serif';
            pageCtx.fillStyle = '#000000';
            pageCtx.fillText(item.code, x + canvasItemWidth / 2, y + 38);
        });

        // 添加最后一页
        const finalPageDataUrl = pageCanvas.toDataURL('image/png');
        pdf.addImage(finalPageDataUrl, 'PNG', 0, 0, pageWidth, pageHeight);

        // 下载 PDF
        const timestamp = new Date().toISOString().slice(0, 10);
        pdf.save(`条形码_${timestamp}.pdf`);
    }

    // 启动
    init();
})();
