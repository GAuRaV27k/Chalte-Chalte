import puppeteer from 'puppeteer';

async function clickButtonWithText(page, text) {
  const clicked = await page.evaluate((targetText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      if (btn.textContent && btn.textContent.toLowerCase().includes(targetText.toLowerCase())) {
        btn.click();
        return true;
      }
    }
    return false;
  }, text);
  return clicked;
}

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // 1. Home Screen
  console.log('1. Capturing Home Screen...');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'screen_home_390x844.png' });

  // 2. Intention Setup Screen
  console.log('2. Navigating to Intention Setup...');
  const clickedPrepare = await clickButtonWithText(page, 'Prepare my walk');
  console.log('Clicked Prepare my walk:', clickedPrepare);
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screen_intention_390x844.png' });

  // 3. Walk Preparation Screen
  console.log('3. Navigating to Walk Preparation...');
  const clickedStartWalk = await clickButtonWithText(page, 'Start my walk');
  console.log('Clicked Start my walk:', clickedStartWalk);
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screen_prep_390x844.png' });

  // 4. Advance into Active Walk Screen
  console.log('4. Fast-forwarding countdown to enter Active Walk...');
  await page.evaluate(() => {
    const orig = Date.now;
    const base = orig();
    Date.now = () => base + 65000;
  });
  // Wait for countdown to hit 0 and Active Walk to mount
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'screen_active_390x844.png' });

  // 5. Pause Overlay Screen
  console.log('5. Clicking pause button to capture Pause Overlay...');
  await page.evaluate(() => {
    const pauseBtn = document.querySelector('button[aria-label="Pause walk"]');
    if (pauseBtn) pauseBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screen_pause_390x844.png' });

  // 6. Resume and End Walk to capture Walk Completion
  console.log('6. Resuming and ending walk to capture Completion...');
  await page.evaluate(() => {
    const resumeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Resume'));
    if (resumeBtn) resumeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const endBtn = document.querySelector('button[aria-label="End walk"]');
    if (endBtn) endBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screen_completion_390x844.png' });

  // 7. Settings Screen
  console.log('7. Navigating to Settings...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await clickButtonWithText(page, 'Settings');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'screen_settings_390x844.png' });

  // 8. Journal Screen
  console.log('8. Navigating to My Journal...');
  await clickButtonWithText(page, 'My Journal');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'screen_journal_390x844.png' });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
