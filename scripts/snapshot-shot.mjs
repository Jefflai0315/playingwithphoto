import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox"],
});

for (const [name, width, height] of [
  ["mobile", 390, 844],
  ["desktop", 1280, 800],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto("http://localhost:5173/snapshot/", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({
    path: `review-screenshots/snapshot-hero-${name}.png`,
  });
  const dims = await page.evaluate(() => {
    const c = document.getElementById("snapshotScrubCanvas");
    const wrap = document.querySelector(".snapshot-canvas-wrap");
    return {
      canvas: [c?.width, c?.height, c?.clientWidth, c?.clientHeight],
      wrap: [wrap?.clientWidth, wrap?.clientHeight],
    };
  });
  console.log(name, JSON.stringify(dims));
  await page.close();
}

await browser.close();
