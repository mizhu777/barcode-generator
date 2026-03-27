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
        // 检查文件类型
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

        // 转换为 JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // 清理数据（跳过空行）
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

        // 显示文件信息
        fileInfo.textContent = `已加载：${fileName}，共 ${excelData.length} 条数据`;
        fileInfo.style.display = 'block';
        fileInput.value = '';

        // 显示预览
        renderPreview();

        // 显示设置和按钮
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

    // 生成 PDF
    async function generatePDF() {
        const columns = getColumnsCount();

        // A4 尺寸（mm）
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;

        // 可用区域
        const contentWidth = pageWidth - margin * 2;
        const contentHeight = pageHeight - margin * 2;

        // 每个条形码单元的尺寸
        const itemWidth = contentWidth / columns;
        const itemHeight = 30; // 每行高度（mm）
        const barcodeHeight = 18; // 条形码高度
        const fontSizeName = 10; // 品名字体大小
        const fontSizeCode = 9; // 编码字体大小

        // 计算总页数
        const rowsPerPage = Math.floor(contentHeight / itemHeight);

        // 创建 PDF
        const pdf = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // 加载中文字体
        try {
            // 使用内置字体但设置正确的编码
            // 添加一个标准字体
            pdf.addFont('Helvetica', 'Standard', 'bold', 'winansi');

            // 设置默认字体
            pdf.setFont('helvetica');
        } catch (e) {
            console.warn('字体加载失败，使用默认字体');
        }

        // 当前页和位置
        let currentPage = 0;
        let currentRow = 0;

        // 预创建一个临时canvas用于生成条形码
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        excelData.forEach((item, index) => {
            // 计算当前位置
            const itemIndex = index;
            const col = itemIndex % columns;
            const row = Math.floor(itemIndex / columns);

            // 检查是否需要新页
            if (row >= (currentPage + 1) * rowsPerPage) {
                currentPage++;
                currentRow = currentPage * rowsPerPage;
                pdf.addPage();
            }

            // 计算 x, y 坐标
            const x = margin + col * itemWidth;
            const y = margin + (row - currentRow) * itemHeight;

            // 设置字体（先尝试用 Unicode 方式）
            pdf.setLanguage('zh-CN');

            // 绘制品名（上方）- 使用 SetDocumentFontWeights 设置粗体
            pdf.setFontSize(fontSizeName);
            pdf.setFont('helvetica', 'bold');

            // 处理品名，确保中文字符正确显示
            const nameText = item.name;
            pdf.text(nameText, x + itemWidth / 2, y + 3, {
                align: 'center',
                encoding: 'UTF-8'
            });

            // 绘制条形码
            try {
                tempCanvas.width = 200;
                tempCanvas.height = 60;

                JsBarcode(tempCanvas, item.code, {
                    format: 'CODE128',
                    width: 1.5,
                    height: 45,
                    displayValue: false,
                    margin: 0,
                    background: '#ffffff'
                });

                const barcodeDataUrl = tempCanvas.toDataURL('image/png');
                const barcodeWidth = itemWidth - 6;
                const barcodeX = x + 3;

                pdf.addImage(barcodeDataUrl, 'PNG', barcodeX, y + 5, barcodeWidth, barcodeHeight);
            } catch (e) {
                // 条形码绘制失败时显示编码文字
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.text(item.code, x + itemWidth / 2, y + 15, { align: 'center' });
            }

            // 绘制编码（下方）
            pdf.setFontSize(fontSizeCode);
            pdf.setFont('helvetica', 'normal');
            pdf.text(item.code, x + itemWidth / 2, y + 26, {
                align: 'center'
            });
        });

        // 下载 PDF
        const timestamp = new Date().toISOString().slice(0, 10);
        pdf.save(`条形码_${timestamp}.pdf`);
    }

    // 启动
    init();
})();
