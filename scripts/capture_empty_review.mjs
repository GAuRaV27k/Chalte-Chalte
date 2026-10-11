import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

async function clickButtonWithText(page, text) {
  return await page.evaluate((targetText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      if (btn.textContent && btn.textContent.toLowerCase().includes(targetText.toLowerCase())) {
        btn.click();
        return true;
      }
    }
    return false;
  }, text);
}

async function run() {
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

    // Seed ended_unsaved session with 0 clips
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
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

    // Reload to open WalkCompletionScreen
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: 'screen_completion_driven_390x844.png' });

    // Drive UI by clicking "Review my reflections" to reach Empty Review state
    const clicked = await clickButtonWithText(page, 'Review my reflections');
    console.log('Clicked review reflections button:', clicked);
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: 'screen_empty_review_driven_390x844.png' });
    console.log('Captured screen_empty_review_driven_390x844.png successfully.');
  } finally {
    await browser.close();
    preview.kill();
  }
}

run().catch(console.error);
