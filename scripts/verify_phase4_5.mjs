import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

async function run() {
  // Launch vite preview on port 4173
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    shell: true,
    stdio: 'ignore',
  });

  await new Promise(r => setTimeout(r, 2000));

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

    // 1. Reduced Motion Test & Capture
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'screen_reduced_motion_home_390x844.png' });
    console.log('Captured reduced motion home screenshot.');

    // 2. 130% Font Scale Test & Capture
    // Emulate 130% zoom / font-scale by applying style or deviceScale / font magnification
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '130%';
    });
    await page.screenshot({ path: 'screen_font_scale_130_home_390x844.png' });
    console.log('Captured 130% font scale home screenshot.');

    // Navigate to Settings at 130% font scale
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const settingsBtn = btns.find(b => b.getAttribute('aria-label') === 'Settings' || b.textContent.includes('Settings'));
      if (settingsBtn) settingsBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'screen_font_scale_130_settings_390x844.png' });
    console.log('Captured 130% font scale settings screenshot.');

    // 3. Drive UI to Empty Review State
    console.log('Setting up ended_unsaved session with 0 clips for Empty Review state...');
    await page.evaluate(async () => {
      const req = indexedDB.open('chalte_chal_db', 2);
      await new Promise((resolve) => {
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction(['sessions', 'clips'], 'readwrite');
          const emptySession = {
            id: 'silent-session-test',
            createdAt: Date.now() - 600000,
            completedAt: Date.now(),
            intention: {
              topic: 'Solitude',
              mood: 'reflective',
              context: 'park',
              durationMinutes: 10,
              language: 'en',
            },
            status: 'ended_unsaved',
            elapsedSeconds: 600,
            questionsDelivered: [
              { id: 'q1', text: 'Where does stillness begin?', philosophySchool: 'Stoic' }
            ],
            clipsCount: 0,
          };
          tx.objectStore('sessions').put(emptySession);
          tx.oncomplete = resolve;
        };
      });
    });

    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'screen_completion_driven_390x844.png' });

    // Click "Review my reflections" if available or drive Review
    await page.evaluate(() => {
      const emptySession = {
        id: 'review-session-test',
        createdAt: Date.now() - 600000,
        completedAt: Date.now(),
        intention: {
          topic: 'Solitude',
          mood: 'reflective',
          context: 'park',
          durationMinutes: 10,
          language: 'en',
        },
        status: 'ended_unsaved',
        elapsedSeconds: 600,
        questionsDelivered: [
          { id: 'q1', text: 'Where does stillness begin?', philosophySchool: 'Stoic' }
        ],
        clipsCount: 0,
      };
      // Trigger review
    });

  } finally {
    await browser.close();
    preview.kill();
  }
}

run().catch(console.error);
