const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' })); // Allow large HTML
app.use(cors()); // Allow your frontend to talk to this server

// The PDF Generator Endpoint
app.post('/api', async (req, res) => {
    let browser = null;
    try {
        const { html, css, showLogo } = req.body || {};

        // Launch Browser (Render has Chrome installed!)
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();

        // Logo Logic
        const logoSVG = `
            <div style="font-size: 20px; color: #2563eb; font-weight: bold; width: 100%; margin-left: 20mm; margin-top: 10mm;">
               YOUR BRAND LOGO
            </div>`;
        const headerTemplate = showLogo ? logoSVG : '<div></div>';

        // Content
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

        await page.setContent(fullContent, { waitUntil: 'networkidle0', timeout: 30000 });

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

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error("PDF Error:", error);
        res.status(500).send('Error generating PDF');
    } finally {
        if (browser) await browser.close();
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
