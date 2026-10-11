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

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // 1. Seed IndexedDB with sample completed session and clips for visual verification
  console.log('Seeding IndexedDB with ended_unsaved test session...');
  await page.evaluate(async () => {
    // Open DB and seed test data
    const request = indexedDB.open('chalte_chal_db', 1);
    await new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = (e) => {
        const db = e.target.result;
        try {
          const tx = db.transaction(['sessions', 'clips', 'transcripts', 'journals'], 'readwrite');
        
        const testSession = {
          id: 'test-phase3-session',
          createdAt: Date.now() - 1500000,
          completedAt: Date.now(),
          intention: {
            topic: 'Ambition & Quiet Presence',
            mood: 'reflective',
            context: 'park',
            durationMinutes: 20,
            language: 'en',
          },
          status: 'ended_unsaved',
          elapsedSeconds: 1200,
          questionsDelivered: [
            { id: 'q1', text: 'Where does stillness begin?', philosophySchool: 'Stoicism', targetMinute: 0 },
            { id: 'q2', text: 'What is within your control right now?', philosophySchool: 'Stoicism', targetMinute: 6 },
            { id: 'q3', text: 'How does walking alter your perspective?', philosophySchool: 'Peripatetic', targetMinute: 12 }
          ],
          clipsCount: 2,
        };

        const clip1 = {
          id: 'clip-1',
          sessionId: 'test-phase3-session',
          recordedAt: Date.now() - 900000,
          durationMs: 42000,
          audioBlob: new Blob(['sample-audio-data-1'], { type: 'audio/webm' }),
          mimeType: 'audio/webm',
        };

        const clip2 = {
          id: 'clip-2',
          sessionId: 'test-phase3-session',
          recordedAt: Date.now() - 400000,
          durationMs: 28000,
          audioBlob: new Blob(['sample-audio-data-2'], { type: 'audio/webm' }),
          mimeType: 'audio/webm',
        };

        const tr1 = {
          id: 'tr-1',
          clipId: 'clip-1',
          text: 'I realized walking past the old trees that urgency was borrowed anxiety. My natural pace is enough.',
          isMock: false,
          timestamp: Date.now() - 890000,
        };

        const tr2 = {
          id: 'tr-2',
          clipId: 'clip-2',
          text: 'Stillness is an active refusal to amplify noise, not an environmental requirement.',
          isMock: false,
          timestamp: Date.now() - 390000,
        };

        tx.objectStore('sessions').put(testSession);
        tx.objectStore('clips').put(clip1);
        tx.objectStore('clips').put(clip2);
        tx.objectStore('transcripts').put(tr1);
        tx.oncomplete = () => resolve();
        } catch (err) {
          reject(err);
        }
      };
    });
  });

  // Reload to trigger automatic resumption of ended_unsaved session
  console.log('Reloading to verify ended_unsaved resumption on startup...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  // 1. Walk Completion Screen
  console.log('Capturing Walk Completion Screen...');
  await page.screenshot({ path: 'screen_completion_390x844.png' });

  // 2. Discard Session Confirmation Modal
  console.log('Opening discard session modal...');
  await clickButtonWithText(page, 'Discard session');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'screen_discard_session_modal_390x844.png' });
  await clickButtonWithText(page, 'Keep walk');
  await new Promise(r => setTimeout(r, 400));

  // 3. Reflection Review Screen (with clips)
  console.log('Navigating to Reflection Review...');
  await clickButtonWithText(page, 'Review my reflections');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screen_review_clips_390x844.png' });

  // 4. Delete clip modal
  console.log('Opening delete clip modal...');
  await page.evaluate(() => {
    const delBtn = document.querySelector('button[aria-label="Delete clip"]');
    if (delBtn) delBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'screen_delete_modal_390x844.png' });
  await clickButtonWithText(page, 'Keep clip');
  await new Promise(r => setTimeout(r, 400));

  // 5. AI Processing Screen (Journal Synthesis)
  console.log('Clicking Generate my journal...');
  await clickButtonWithText(page, 'Generate my journal');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'screen_processing_journal_390x844.png' });

  // Wait for Journal synthesis to finish (1000ms delay in mock)
  console.log('Waiting for Journal Result...');
  await new Promise(r => setTimeout(r, 1400));
  await page.screenshot({ path: 'screen_journal_result_390x844.png' });

  // 6. Journal Edit Mode
  console.log('Opening Journal Edit mode...');
  await clickButtonWithText(page, 'Edit Journal');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'screen_journal_edit_390x844.png' });

  // 7. Unsaved Changes Guard
  console.log('Testing back button with unsaved edits...');
  await page.evaluate(() => {
    const backBtn = document.querySelector('button[aria-label="Back"]');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'screen_journal_unsaved_390x844.png' });
  await clickButtonWithText(page, 'Stay');
  await new Promise(r => setTimeout(r, 300));
  await clickButtonWithText(page, 'Done editing');
  await new Promise(r => setTimeout(r, 400));

  // 8. Save Journal to IndexedDB
  console.log('Saving journal...');
  await clickButtonWithText(page, 'Save to Journal');
  await new Promise(r => setTimeout(r, 600));

  console.log('All Phase 3 screenshots captured successfully!');
  await browser.close();
}

capture().catch((err) => {
  console.error('Phase 3 capture error:', err);
  process.exit(1);
});
