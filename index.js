const puppeteer = require('puppeteer');
const fs = require('fs');
const {convert} = require('url-slug');

const meta = [];

const collectPage = async page => {
  const permalink = await page.evaluate(() => {
    return [...document.querySelectorAll('p')].find(
      el => el.innerText === 'Permanent Link:'
    ).nextSibling.innerText;
  });

  const date = await page.evaluate(() => {
    return document.querySelector('.volume-subheading').innerText;
  });

  const volume = await page.evaluate(() => {
    return document.querySelector('[aria-label="go to the previous volume"]')
      .nextSibling.innerText;
  });

  const filename = `${convert(volume)}.jpg`;

  await page.click('.image-link');
  await page.waitForNetworkIdle();

  const url = await page.evaluate(async () => {
    return document.querySelector('img[data-testid]').src;
  });

  const res = await fetch(url);
  const blob = await res.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  return {
    volume,
    date,
    filename,
    permalink,
    buffer,
  };
};

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--start-maximized'],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto('https://dloc.com/UF00090030/00058');
  await page.waitForNetworkIdle();

  let err;
  while (!err) {
    try {
      const {volume, date, filename, permalink, buffer} = await collectPage(
        page
      );

      meta.push({
        volume,
        date,
        filename,
        permalink,
      });

      fs.writeFile(`./.scrape/${filename}`, buffer, () => {});
      console.log(`Wrote ${volume}`);

      await Promise.all([
        page.waitForNavigation(),
        page.click('[aria-label="go to the next volume"]'),
      ]);
    } catch (error) {
      err = error;
      console.error(error);
    }
  }

  await browser.close();

  fs.writeFile(`./.scrape/meta.json`, JSON.stringify(meta), () => {});
};

main();
