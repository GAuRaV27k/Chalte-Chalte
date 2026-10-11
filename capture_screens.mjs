import puppeteer from 'puppeteer';

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });


  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // 1. Home Screen
  await page.screenshot({ path: 'screen_home_390x844.png' });

  // 2. Intention Setup Screen (Click "Prepare my walk")
  const prepareBtn = await page.waitForSelector('button:has-text("Prepare my walk")');
  if (prepareBtn) {
    await prepareBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'screen_intention_390x844.png' });
  }

  // 3. Settings Screen
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  const settingsTab = await page.waitForSelector('nav button:has-text("Settings")');
  if (settingsTab) {
    await settingsTab.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'screen_settings_390x844.png' });
  }

  // 4. Journal Screen
  const journalTab = await page.waitForSelector('nav button:has-text("My Journal")');
  if (journalTab) {
    await journalTab.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'screen_journal_390x844.png' });
  }

  await browser.close();
}

capture().catch(console.error);
