# PHP-Chrome-HTML2PDF Removal Plan

## Current State Analysis

### Dependencies Found:
- **Main Package**: `spiritix/php-chrome-html2pdf` (v1.8.1) - listed in composer.json
- **Dependent Package**: `oat-sa/composer-npm-bridge` (v0.4.6) - required by php-chrome-html2pdf

### Usage Analysis:
- **File Using Library**: `backend/controllers/test.php`
  - Imports: `Spiritix\Html2Pdf\Converter`, `StringInput`, `DownloadOutput`, `StringOutput`
  - Purpose: Generates PDF receipts from HTML templates using Puppeteer/Chrome
  - Dependencies: Requires Node.js and Google Chrome installed on system

### Functionality Being Replaced:
- PDF generation for payment receipts
- HTML to PDF conversion using headless Chrome
- Receipt template rendering with proper styling

## Removal Plan

### Step 1: Update composer.json
- Remove `"spiritix/php-chrome-html2pdf": "^1.8"` from require section
- The `oat-sa/composer-npm-bridge` will be automatically removed as it's a dependency

### Step 2: Update test.php
- Comment out or remove all Spiritix-related code
- Remove imports: `use Spiritix\Html2Pdf\Converter`, etc.
- Replace PDF generation logic with alternative solution or placeholder

### Step 3: Update Dependencies
- Run `composer update` to remove packages from vendor/
- Clean up autoload files

### Step 4: Verification
- Ensure no other files use the library
- Test that application still functions (minus PDF generation)

## Impact Assessment

### What Will Stop Working:
- PDF receipt generation in `backend/controllers/test.php`
- Any HTML-to-PDF conversion functionality using this library

### What Remains Unchanged:
- All other application functionality
- Database operations
- User authentication
- Email functionality
- All other dependencies

## Alternative Solutions (Future):
If PDF generation is still needed, consider:
- `dompdf/dompdf` (already installed) - pure PHP PDF generation
- `mpdf/mpdf` - another pure PHP solution
- Server-side PDF services
- Client-side PDF generation with JavaScript

## Confirmation Required:
Please confirm if you want to proceed with this removal plan. The PDF generation functionality will be completely removed from the test.php file.
