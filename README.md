# 条形码生成器

上传 Excel 文件，快速生成可打印的条形码 PDF。

## 功能特点

- 纯前端处理，无需上传服务器
- 支持 .xlsx 和 .xls 格式
- Code128 条形码格式
- 可调节每行条形码数量（4/5/6 个）
- A4 纸直接打印

## Excel 模板格式

示例文件：`docs/模板示例.csv`（可用 Excel 打开并另存为 .xlsx）

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
