const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
    let browser = null;
    try {
        // 1. SETUP FOR VERCEL (Node 22+)
        // We do not set specific graphic modes manually anymore, 
        // we let the library handle the new environment defaults.
        
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        // 2. GET DATA
        const { html, css, showLogo } = req.body || {};

        // 3. LOGO LOGIC
        const logoSVG = `
            <div style="font-size: 20px; color: #2563eb; font-weight: bold; width: 100%; margin-left: 20mm; margin-top: 10mm;">
               YOUR BRAND LOGO
            </div>`;

        const headerTemplate = showLogo ? logoSVG : '<div></div>';

        // 4. PREPARE HTML
        const fullContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; font-family: sans-serif; }
                    ${css}
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            </head>
            <body>
                ${html}
            </body>
            </html>
        `;

        // 5. LOAD & PRINT
        await page.setContent(fullContent, { waitUntil: 'networkidle0', timeout: 10000 });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: showLogo ? '40mm' : '20mm',
                bottom: '20mm',
                left: '0mm',
                right: '0mm'
            },
            displayHeaderFooter: true,
            headerTemplate: headerTemplate,
            footerTemplate: `
                <div style="font-size: 10px; width: 100%; text-align: center; color: #666; padding-bottom: 10px;">
                    Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
            `
        });

        // 6. SEND RESPONSE
        res.setHeader('Content-Type', 'application/pdf');
        res.status(200).send(pdfBuffer);

    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).send('Server Error: ' + error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
