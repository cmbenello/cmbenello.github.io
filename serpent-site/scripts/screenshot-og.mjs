import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ 
  headless: 'new',
  defaultViewport: { width: 1200, height: 630 }
});
const page = await browser.newPage();
await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

await page.addStyleTag({
  content: `
    h1, h2, h3, h4, h5, h6, p, li, a, span, button, label {
      opacity: 0 !important;
    }
  `
});

await new Promise(r => setTimeout(r, 1500));

await page.screenshot({ 
  path: 'public/og-image.png',
  type: 'png'
});

await browser.close();
console.log('Saved public/og-image.png');
