// api/index.js
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
    let browser = null;
    try {
        // 1. OPTIMIZED LAUNCH SETTINGS FOR VERCEL
        // This setup forces the browser to run in a way that doesn't need 
        // the missing system files (libnss3).
        chromium.setHeadlessMode = true;
        chromium.setGraphicsMode = false;

        browser = await puppeteer.launch({
            args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // 2. Get data
        const { html, css, showLogo } = req.body || {};

        // 3. LOGO LOGIC (Placeholder for now)
        const logoSVG = `
            <div style="font-size: 20px; color: #2563eb; font-weight: bold; width: 100%; margin-left: 20mm; margin-top: 10mm;">
               YOUR BRAND LOGO
            </div>`;

        const headerTemplate = showLogo ? logoSVG : '<div></div>';

        // 4. Combine HTML + CSS
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

        // 5. Load content (With Timeout Safety)
        // We reduce timeout to 6 seconds to fail fast if it hangs
        await page.setContent(fullContent, { waitUntil: 'networkidle0', timeout: 6000 });

        // 6. Generate PDF
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

        // 7. Send back
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
