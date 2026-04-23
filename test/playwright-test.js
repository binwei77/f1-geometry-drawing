const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  console.log('Navigating to F1 page...');
  await page.goto('http://39.106.26.127/f1/', { timeout: 30000 });

  const title = await page.title();
  console.log('Page title:', title);

  const url = await page.url();
  console.log('Current URL:', url);

  const content = await page.content();

  // 检查关键元素
  const hasCanvas = content.includes('<canvas');
  const hasCommandInput = content.includes('command') || content.includes('input');
  const hasButtons = content.includes('缩放') || content.includes('撤销');

  console.log('检测结果:');
  console.log('  - Canvas元素:', hasCanvas ? '✓' : '✗');
  console.log('  - 命令输入框:', hasCommandInput ? '✓' : '✗');
  console.log('  - 功能按钮:', hasButtons ? '✓' : '✗');

  await page.screenshot({ path: '/tmp/playwright-test.png', fullPage: false });
  console.log('Screenshot saved to /tmp/playwright-test.png');

  await browser.close();
  console.log('Test completed successfully!');
})();
