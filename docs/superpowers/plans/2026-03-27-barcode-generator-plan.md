# 条形码生成器 实现计划

**目标：** 构建一个纯前端的条形码生成网站，用户上传Excel后可生成A4可打印PDF

**架构：** 纯前端实现，所有文件处理在浏览器完成，无需后端服务器

**技术栈：** HTML + CSS + JavaScript + JsBarcode + jsPDF + SheetJS

---

## 文件结构

```
barcode-generator/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件
├── js/
│   └── app.js              # 主逻辑（所有JS逻辑合并在一个文件）
├── lib/                    # 第三方库
│   ├── jspdf.min.js
│   ├── xlsx.full.min.js
│   └── JsBarcode.min.js
├── docs/
│   └── 模板示例.xlsx        # Excel模板
└── README.md
```

---

## 任务清单

### 任务 1: 创建项目基础结构和 HTML 页面

**文件：**
- 创建: `index.html`

- [ ] **Step 1: 创建 index.html 主页面**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>条形码生成器</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>📦 条形码生成器</h1>
            <p class="subtitle">上传Excel文件，快速生成可打印的条形码PDF</p>
        </header>

        <main class="main-content">
            <!-- 上传区域 -->
            <section class="upload-section">
                <div class="upload-area" id="uploadArea">
                    <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p class="upload-text">拖拽 Excel 文件到此处</p>
                    <p class="upload-hint">或点击选择文件</p>
                    <input type="file" id="fileInput" accept=".xlsx,.xls" hidden>
                </div>
                <p class="file-info" id="fileInfo"></p>
            </section>

            <!-- 预览区域 -->
            <section class="preview-section" id="previewSection" style="display: none;">
                <h2>数据预览</h2>
                <div class="preview-table-wrapper">
                    <table class="preview-table" id="previewTable">
                        <thead>
                            <tr>
                                <th>编码</th>
                                <th>品名</th>
                            </tr>
                        </thead>
                        <tbody id="previewBody">
                        </tbody>
                    </table>
                </div>
                <p class="preview-count" id="previewCount"></p>
            </section>

            <!-- 设置区域 -->
            <section class="settings-section" id="settingsSection" style="display: none;">
                <h2>布局设置</h2>
                <div class="setting-row">
                    <span class="setting-label">每行条形码数量：</span>
                    <div class="radio-group" id="columnsGroup">
                        <label class="radio-item">
                            <input type="radio" name="columns" value="4">
                            <span>4个</span>
                        </label>
                        <label class="radio-item">
                            <input type="radio" name="columns" value="5" checked>
                            <span>5个</span>
                        </label>
                        <label class="radio-item">
                            <input type="radio" name="columns" value="6">
                            <span>6个</span>
                        </label>
                    </div>
                </div>
            </section>

            <!-- 生成按钮 -->
            <section class="action-section" id="actionSection" style="display: none;">
                <button class="btn-generate" id="generateBtn">
                    生成 PDF 下载
                </button>
            </section>
        </main>

        <footer class="footer">
            <p>支持 Excel .xlsx/.xls 文件 | Code128 格式</p>
        </footer>
    </div>

    <!-- 第三方库 -->
    <script src="lib/xlsx.full.min.js"></script>
    <script src="lib/jspdf.min.js"></script>
    <script src="lib/JsBarcode.min.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 提交**

```bash
git add index.html
git commit -m "feat: create main HTML page structure"
```

---

### 任务 2: 创建样式文件

**文件：**
- 创建: `css/style.css`

- [ ] **Step 1: 创建 css/style.css**

```css
/* 基础重置 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary: #2563EB;
    --primary-hover: #1D4ED8;
    --bg: #F8FAFC;
    --card: #FFFFFF;
    --text: #1E293B;
    --text-light: #64748B;
    --border: #E2E8F0;
    --success: #10B981;
    --error: #EF4444;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    flex: 1;
}

/* 头部 */
.header {
    text-align: center;
    margin-bottom: 40px;
}

.header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 8px;
}

.subtitle {
    color: var(--text-light);
    font-size: 1rem;
}

/* 上传区域 */
.upload-section {
    margin-bottom: 30px;
}

.upload-area {
    border: 2px dashed var(--border);
    border-radius: 12px;
    padding: 60px 40px;
    text-align: center;
    background: var(--card);
    cursor: pointer;
    transition: all 0.2s ease;
}

.upload-area:hover,
.upload-area.dragover {
    border-color: var(--primary);
    background: rgba(37, 99, 235, 0.05);
}

.upload-icon {
    width: 48px;
    height: 48px;
    color: var(--primary);
    margin-bottom: 16px;
}

.upload-text {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 4px;
}

.upload-hint {
    font-size: 0.875rem;
    color: var(--text-light);
}

.file-info {
    margin-top: 12px;
    font-size: 0.875rem;
    color: var(--success);
    text-align: center;
}

/* 预览区域 */
.preview-section {
    background: var(--card);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 30px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.preview-section h2 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text);
}

.preview-table-wrapper {
    overflow-x: auto;
}

.preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.preview-table th,
.preview-table td {
    padding: 10px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
}

.preview-table th {
    background: var(--bg);
    font-weight: 600;
    color: var(--text);
}

.preview-table tbody tr:hover {
    background: rgba(37, 99, 235, 0.03);
}

.preview-count {
    margin-top: 12px;
    font-size: 0.875rem;
    color: var(--text-light);
}

/* 设置区域 */
.settings-section {
    background: var(--card);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 30px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.settings-section h2 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text);
}

.setting-row {
    display: flex;
    align-items: center;
    gap: 20px;
}

.setting-label {
    font-size: 0.875rem;
    color: var(--text);
}

.radio-group {
    display: flex;
    gap: 16px;
}

.radio-item {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 0.875rem;
}

.radio-item input[type="radio"] {
    width: 16px;
    height: 16px;
    accent-color: var(--primary);
}

.radio-item span {
    color: var(--text);
}

/* 生成按钮 */
.action-section {
    text-align: center;
    margin-bottom: 40px;
}

.btn-generate {
    background: var(--primary);
    color: white;
    border: none;
    padding: 16px 48px;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-generate:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
}

.btn-generate:active {
    transform: translateY(0);
}

/* 页脚 */
.footer {
    text-align: center;
    padding: 20px;
    color: var(--text-light);
    font-size: 0.75rem;
}

/* 响应式 */
@media (max-width: 600px) {
    .container {
        padding: 20px 16px;
    }

    .header h1 {
        font-size: 1.5rem;
    }

    .upload-area {
        padding: 40px 20px;
    }

    .setting-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add css/style.css
git commit -m "feat: add styles for the barcode generator"
```

---

### 任务 3: 创建主逻辑 JavaScript 文件

**文件：**
- 创建: `js/app.js`

- [ ] **Step 1: 创建 js/app.js（完整逻辑）**

```javascript
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

        if (!validTypes.includes(file.type) && !['xlsx', 'xls'].includes(extension)) {
            alert('请上传 Excel 文件 (.xlsx 或 .xls)');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                parseExcel(e.target.result);
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
    function parseExcel(data) {
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
        fileInfo.textContent = `已加载：${file.name}，共 ${excelData.length} 条数据`;
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

        previewRows.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.name)}</td>`;
            previewBody.appendChild(tr);
        });

        const total = excelData.length;
        const display = total > 5 ? `显示前 5 条，共 ${total} 条` : `共 ${total} 条`;
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
    function generatePDF() {
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
        const barcodeHeight = 20; // 条形码高度
        const fontSizeName = 12; // 品名字体大小
        const fontSizeCode = 10; // 编码字体大小

        // 计算总页数
        const rowsPerPage = Math.floor(contentHeight / itemHeight);
        const totalItems = excelData.length;
        const totalRows = Math.ceil(totalItems / columns);
        const totalPages = Math.ceil(totalRows / rowsPerPage);

        // 创建 PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // 当前页和位置
        let currentPage = 0;
        let currentRow = 0;

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

            // 绘制品名（上方）
            pdf.setFontSize(fontSizeName);
            pdf.setFont('helvetica', 'bold');
            pdf.text(item.name, x + itemWidth / 2, y + 4, { align: 'center' });

            // 绘制条形码（使用 SVG 绘制）
            try {
                // 创建临时 canvas 绘制条形码
                const canvas = document.createElement('canvas');
                JsBarcode(canvas, item.code, {
                    format: 'CODE128',
                    width: 1,
                    height: 40,
                    displayValue: false,
                    margin: 0
                });

                const barcodeDataUrl = canvas.toDataURL('image/png');
                const barcodeWidth = itemWidth - 4;
                const barcodeX = x + 2;

                pdf.addImage(barcodeDataUrl, 'PNG', barcodeX, y + 5, barcodeWidth, barcodeHeight);
            } catch (e) {
                // 条形码绘制失败时显示错误提示
                pdf.setFontSize(8);
                pdf.setTextColor(255, 0, 0);
                pdf.text('条码错误', x + itemWidth / 2, y + 15, { align: 'center' });
                pdf.setTextColor(0, 0, 0);
            }

            // 绘制编码（下方）
            pdf.setFontSize(fontSizeCode);
            pdf.setFont('helvetica', 'normal');
            pdf.text(item.code, x + itemWidth / 2, y + 28, { align: 'center' });
        });

        // 下载 PDF
        const timestamp = new Date().toISOString().slice(0, 10);
        pdf.save(`条形码_${timestamp}.pdf`);
    }

    // 启动
    init();
})();
```

- [ ] **Step 2: 提交**

```bash
git add js/app.js
git commit -m "feat: add main JavaScript logic for barcode generation"
```

---

### 任务 4: 下载第三方库文件

**文件：**
- 创建: `lib/jspdf.min.js`
- 创建: `lib/xlsx.full.min.js`
- 创建: `lib/JsBarcode.min.js`

- [ ] **Step 1: 下载 jsPDF**

打开 https://cdnjs.com/ 搜索 jspdf，下载 jspdf.min.js 到 lib/ 目录

- [ ] **Step 2: 下载 SheetJS**

打开 https://cdnjs.com/ 搜索 xlsx，下载 xlsx.full.min.js 到 lib/ 目录

- [ ] **Step 3: 下载 JsBarcode**

打开 https://cdnjs.com/ 搜索 JsBarcode，下载 JsBarcode.min.js 到 lib/ 目录

- [ ] **Step 4: 提交**

```bash
git add lib/
git commit -m "feat: add third-party libraries (jsPDF, SheetJS, JsBarcode)"
```

---

### 任务 5: 创建 Excel 模板和 README

**文件：**
- 创建: `docs/模板示例.xlsx`
- 创建: `README.md`

- [ ] **Step 1: 创建 README.md**

```markdown
# 条形码生成器

上传 Excel 文件，快速生成可打印的条形码 PDF。

## 功能特点

- 纯前端处理，无需上传服务器
- 支持 .xlsx 和 .xls 格式
- Code128 条形码格式
- 可调节每行条形码数量（4/5/6 个）
- A4 纸直接打印

## Excel 模板格式

| 编码 | 品名 |
|------|------|
| 02060001 | 螺丝M6x30 |
| 02060002 | 螺母M8 |
| 02060003 | 垫片M10 |

**注意：**
- 第一行为表头，会自动跳过
- 编码列和品名列顺序不能颠倒
- 编码建议使用纯数字

## 使用方法

1. 打开 `index.html` 文件
2. 拖拽或点击上传 Excel 文件
3. 选择每行显示的条形码数量
4. 点击「生成 PDF 下载」按钮

## 技术栈

- [JsBarcode](https://github.com/lindell/JsBarcode) - 条形码生成
- [jsPDF](https://github.com/parallax/jsPDF) - PDF 生成
- [SheetJS](https://github.com/SheetJS/sheetjs) - Excel 解析

## 浏览器兼容

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
```

- [ ] **Step 2: 创建 Excel 模板文件**

手动创建一个 Excel 文件，包含示例数据：
- 第一行：编码、品名（表头）
- 后续行：示例数据

- [ ] **Step 3: 提交**

```bash
git add README.md docs/
git commit -m "docs: add README and Excel template"
```

---

### 任务 6: 本地验证

- [ ] **Step 1: 用浏览器打开 index.html 测试**

测试流程：
1. 点击上传区域，选择 Excel 文件
2. 确认预览区域显示数据
3. 切换每行数量（4/5/6）
4. 点击生成 PDF
5. 确认 PDF 下载并用 PDF 阅读器打开验证

预期结果：
- 条形码清晰可扫描
- 品名在条形码上方
- 编码在条形码下方
- A4 纸打印效果正常

---

## 自检清单

- [ ] spec 覆盖：每行4/5/6数量选项 ✓
- [ ] spec 覆盖：品名在上、编码在下 ✓
- [ ] spec 覆盖：A4 排版 ✓
- [ ] spec 覆盖：Excel 固定两列模板 ✓
- [ ] spec 覆盖：Code128 格式 ✓
- [ ] spec 覆盖：拖拽上传 ✓
- [ ] spec 覆盖：视觉设计风格 ✓
- [ ] 所有步骤包含实际代码
- [ ] 所有步骤包含具体命令
- [ ] 无 placeholder (TBD/TODO)

---

**计划完成时间：** 约 2-3 小时（包括开发和测试）

**代码量预估：**
- HTML: ~80 行
- CSS: ~200 行
- JS: ~250 行
- 合计: ~530 行
