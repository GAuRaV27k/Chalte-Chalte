import puppeteer from 'puppeteer';

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

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  console.log('1. Navigating to Chalte-Chalte...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // 1. Capture Notification Explainer Modal
  console.log('Capturing Notification Explainer modal...');
  // Click "Begin a Walk" or start setup
  await clickButtonWithText(page, 'Begin a Walk');
  await new Promise((r) => setTimeout(r, 400));
  // Click "Start my walk"
  await clickButtonWithText(page, 'Start my walk');
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: 'screen_notification_explainer_390x844.png' });

  // Click Allow or Deny to proceed
  await clickButtonWithText(page, 'Allow');
  await new Promise((r) => setTimeout(r, 400));

  // 2. Capture Empty Review State (Drive Real UI with 0 clips)
  console.log('Seeding ended_unsaved session with 0 clips for Empty Review state...');
  await page.evaluate(async () => {
    const req = indexedDB.open('chalte_chal_db', 2);
    await new Promise((resolve) => {
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(['sessions', 'clips'], 'readwrite');
        const emptySession = {
          id: 'test-silent-session',
          createdAt: Date.now() - 1200000,
          completedAt: Date.now(),
          intention: {
            topic: 'Stillness & Silence',
            mood: 'reflective',
            context: 'park',
            durationMinutes: 20,
            language: 'en',
          },
          status: 'ended_unsaved',
          elapsedSeconds: 1200,
          questionsDelivered: [
            { id: 'q1', text: 'Where does stillness begin?', philosophySchool: 'Stoicism', targetMinute: 0 },
          ],
          clipsCount: 0,
        };
        tx.objectStore('sessions').put(emptySession);
        tx.oncomplete = resolve;
      };
    });
  });

  // Reload to resume ended_unsaved completion screen
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  console.log('Capturing Completion Screen with Save my walk as Primary...');
  await page.screenshot({ path: 'screen_completion_phase4_390x844.png' });

  // Now seed a 0-clip review screen view directly in state or navigate
  await page.evaluate(async () => {
    // Add 1 clip so review reflections button appears
    const req = indexedDB.open('chalte_chal_db', 2);
    await new Promise((resolve) => {
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(['sessions'], 'readwrite');
        const s = {
          id: 'test-silent-session',
          createdAt: Date.now() - 1200000,
          completedAt: Date.now(),
          intention: {
            topic: 'Stillness & Silence',
            mood: 'reflective',
            context: 'park',
            durationMinutes: 20,
            language: 'en',
          },
          status: 'ended_unsaved',
          elapsedSeconds: 1200,
          questionsDelivered: [],
          clipsCount: 1, // temporary so button shows
        };
        tx.objectStore('sessions').put(s);
        tx.oncomplete = resolve;
      };
    });
  });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  // Click Review reflections, but with 0 clips stored in clips store!
  await clickButtonWithText(page, 'Review my reflections');
  await new Promise((r) => setTimeout(r, 600));
  console.log('Capturing Empty/Silent Review Screen...');
  await page.screenshot({ path: 'screen_review_silent_empty_390x844.png' });

  // 3. Capture My Journal Screen (Empty State)
  console.log('Navigating to My Journal (Empty State)...');
  await page.evaluate(async () => {
    // Clear journals
    const req = indexedDB.open('chalte_chal_db', 2);
    await new Promise((resolve) => {
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(['journals', 'sessions'], 'readwrite');
        tx.objectStore('journals').clear();
        tx.objectStore('sessions').clear();
        tx.oncomplete = resolve;
      };
    });
  });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));
  await clickButtonWithText(page, 'My Journal');
  await new Promise((r) => setTimeout(r, 500));
  console.log('Capturing My Journal Empty State...');
  await page.screenshot({ path: 'screen_my_journal_empty_390x844.png' });

  // 4. Capture My Journal Screen (Populated Cards & Topic Filter Chips)
  console.log('Seeding saved sessions and journals...');
  await page.evaluate(async () => {
    const req = indexedDB.open('chalte_chal_db', 2);
    await new Promise((resolve) => {
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(['sessions', 'journals', 'clips', 'transcripts'], 'readwrite');

        const sess1 = {
          id: 'sess-saved-1',
          createdAt: Date.now() - 86400000 * 2,
          completedAt: Date.now() - 86400000 * 2 + 1440000,
          intention: { topic: 'Career & Ambition', mood: 'curious', context: 'park', durationMinutes: 24, language: 'en' },
          status: 'saved',
          elapsedSeconds: 1440,
          questionsDelivered: [{ id: 'q1', text: 'Where does stillness begin?', philosophySchool: 'Stoicism', targetMinute: 0 }],
          clipsCount: 2,
        };

        const journal1 = {
          id: 'jrn-1',
          sessionId: 'sess-saved-1',
          createdAt: Date.now() - 86400000 * 2,
          topic: 'Career & Ambition',
          title: 'The Difference Between Ambition and Expectation',
          durationMinutes: 24,
          myReflections: 'Walking past the rustling trees at Nehru Park, I realized what felt like failure was just a borrowed sense of urgency. My natural pace is enough to sustain meaningful work.',
          ideasWorthRevisiting: ['Ambition clarifies effort, expectation breeds resentment.'],
          questionToCarryForward: 'What standard are you measuring yourself against when no one else is in the room?',
          oneSmallNextStep: 'Leave a two minute gap before answering urgent emails tomorrow morning.',
          walkingSummary: 'A 24 minute contemplative walk.',
          coreInsight: 'Urgency was borrowed anxiety.',
          quote: { text: 'Solvitur ambulando', author: 'Diogenes' },
          questionsReflected: ['Where does stillness begin?'],
          userReflections: 'Urgency was borrowed anxiety.',
          isMock: false,
        };

        const sess2 = {
          id: 'sess-saved-2',
          createdAt: Date.now() - 86400000 * 5,
          completedAt: Date.now() - 86400000 * 5 + 1080000,
          intention: { topic: 'Solitude & Meaning', mood: 'reflective', context: 'urban', durationMinutes: 18, language: 'en' },
          status: 'saved',
          elapsedSeconds: 1080,
          questionsDelivered: [],
          clipsCount: 1,
        };

        const journal2 = {
          id: 'jrn-2',
          sessionId: 'sess-saved-2',
          createdAt: Date.now() - 86400000 * 5,
          topic: 'Solitude & Meaning',
          title: 'The Architecture of Quiet Hours',
          durationMinutes: 18,
          myReflections: 'In the early morning mist along Lodhi Road, the city felt like an empty gallery. Solitude was not loneliness; it was permission to observe without participating.',
          walkingSummary: 'An 18 minute solitude walk.',
          coreInsight: 'Solitude as spaciousness.',
          quote: { text: 'Solitude gives space for thoughts to settle like clear water.', author: 'Society & Contemplation' },
          questionsReflected: [],
          userReflections: 'Solitude is permission to observe.',
          isMock: false,
        };

        tx.objectStore('sessions').put(sess1);
        tx.objectStore('sessions').put(sess2);
        tx.objectStore('journals').put(journal1);
        tx.objectStore('journals').put(journal2);
        tx.oncomplete = resolve;
      };
    });
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));
  await clickButtonWithText(page, 'My Journal');
  await new Promise((r) => setTimeout(r, 600));
  console.log('Capturing My Journal Populated List Screen...');
  await page.screenshot({ path: 'screen_my_journal_list_390x844.png' });

  // 5. Capture Journal Entry Detail Modal
  console.log('Opening Journal Detail Modal...');
  await clickButtonWithText(page, 'The Difference Between Ambition');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: 'screen_journal_detail_390x844.png' });
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close detail"]');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // 6. Capture Settings Screen
  console.log('Navigating to Settings Screen...');
  await clickButtonWithText(page, 'Settings');
  await new Promise((r) => setTimeout(r, 600));
  console.log('Capturing Settings Screen Top...');
  await page.screenshot({ path: 'screen_settings_top_390x844.png' });

  console.log('Capturing Settings Screen Bottom & Privacy Notice...');
  await page.evaluate(() => window.scrollTo(0, 900));
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: 'screen_settings_bottom_390x844.png' });

  // 7. Capture Factory Reset / Wipe Data Modal
  console.log('Opening Wipe All Local Data modal...');
  await clickButtonWithText(page, 'Delete all local data');
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: 'screen_wipe_modal_390x844.png' });
  await clickButtonWithText(page, 'Cancel');
  await new Promise((r) => setTimeout(r, 400));

  // 8. Capture AI Server Consent Modal
  console.log('Opening My Server AI Consent Modal...');
  await clickButtonWithText(page, 'My server');
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: 'screen_server_consent_modal_390x844.png' });

  console.log('All Phase 4 screenshots captured successfully!');
  await browser.close();
}

capture().catch((err) => {
  console.error('Phase 4 screenshot capture error:', err);
  process.exit(1);
});
