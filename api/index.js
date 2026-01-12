// api/index.js
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
    // 1. Setup the browser (The heavy lifting)
    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        // 2. Get data from your Frontend
        const { html, css, showLogo } = req.body || {};

        // 3. LOGO LOGIC (Paste your SVG later where it says LOGO_HERE)
        // We use a "Header Template". It repeats on every page if you want.
        const logoSVG = `
            <div style="font-size: 20px; color: #2563eb; font-weight: bold; width: 100%; margin-left: 20mm; margin-top: 10mm;">
                <!-- PASTE SVG CODE HERE LATER -->
                YOUR BRAND LOGO
            </div>`;

        const headerTemplate = showLogo ? logoSVG : '<div></div>';

        // 4. Combine HTML + CSS
        // We inject the CSS directly into the HTML to ensure it renders
        const fullContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    /* Basic Print Reset */
                    body { margin: 0; font-family: sans-serif; }
                    ${css}
                </style>
                <!-- Load Fonts (Optional) -->
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
            </head>
            <body>
                ${html}
            </body>
            </html>
        `;

        // 5. Load content into the hidden chrome tab
        await page.setContent(fullContent, { waitUntil: 'networkidle0' });

        // 6. Generate the PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: showLogo ? '40mm' : '20mm', // Make room for logo if active
                bottom: '20mm',
                left: '0mm', // We handle margins in CSS usually, or set here
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

        // 7. Send back the file
        res.setHeader('Content-Type', 'application/pdf');
        res.status(200).send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF: ' + error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
