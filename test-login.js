const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console errors
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure().errorText));

  // Capture API responses
  page.on('response', async res => {
    if (res.url().includes('auth') || res.url().includes('login')) {
      console.log('RESPONSE:', res.status(), res.url());
      try { console.log('BODY:', await res.text()); } catch(e) {}
    }
  });

  await page.goto('http://localhost:5500/login');
  await page.fill('input[type="email"]', 'admin@bgs.local');
  await page.fill('input[type="password"]', 'admin1234');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot-after-login.png' });
  console.log('Final URL:', page.url());
  await browser.close();
})();
