import { test, expect } from '@playwright/test';

test.describe('audio-video.html', () => {
  const url: string = '/pages/html/audio-video.html';

  test('loads and shows stable identifiers', async ({ page }): Promise<void> => {
    await page.goto(url);

    await expect(page.getByTestId('page-title')).toHaveText('Audio & Video');
    await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'audio-video');
    await expect(page.getByTestId('main')).toBeVisible();
  });

  test('skip link targets main and updates hash', async ({ page }): Promise<void> => {
    await page.goto(url);

    const skip = page.getByTestId('skip-link');
    await expect(skip).toHaveAttribute('href', '#main');

    await skip.click();
    await expect(page).toHaveURL(/#main$/);
  });

  test('audio element has expected attributes', async ({ page }): Promise<void> => {
    await page.goto(url);

    const audio = page.getByTestId('audio');

    await expect(audio).toBeVisible();
    await expect(audio).toHaveAttribute('controls', '');
    await expect(audio).toHaveAttribute('preload', 'none');

    // No <source> expected
    await expect(audio.locator('source')).toHaveCount(0);

    await expect(page.getByTestId('audio-note')).toContainText(
      'No source on purpose'
    );
  });

  test('video element has expected attributes and track', async ({ page }): Promise<void> => {
    await page.goto(url);

    const video = page.getByTestId('video');

    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video).toHaveAttribute('playsinline', '');
    await expect(video).toHaveAttribute('muted', '');
    await expect(video).toHaveAttribute('width', '420');
    await expect(video).toHaveAttribute('height', '236');

    // No <source> expected
    await expect(video.locator('source')).toHaveCount(0);

    const track = page.getByTestId('track');
    await expect(track).toHaveAttribute('kind', 'captions');
    await expect(track).toHaveAttribute('srclang', 'en');
    await expect(track).toHaveAttribute('label', 'English');
    await expect(track).toHaveAttribute('default', '');
    await expect(track).toHaveAttribute('src', /data:text\/vtt/);

    await expect(page.getByTestId('video-note')).toContainText(
      'No source on purpose'
    );
  });

  test('video and audio are paused by default', async ({ page }): Promise<void> => {
    await page.goto(url);

    const audioPaused = await page.getByTestId('audio').evaluate<boolean>(
      (el): boolean => (el as HTMLAudioElement).paused
    );

    const videoPaused = await page.getByTestId('video').evaluate<boolean>(
      (el): boolean => (el as HTMLVideoElement).paused
    );

    expect(audioPaused).toBe(true);
    expect(videoPaused).toBe(true);
  });
});
