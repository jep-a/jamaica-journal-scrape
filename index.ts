import puppeteer from 'puppeteer';
import fs from 'fs';
import volumes from './volumes.json';
import {convert} from 'url-slug';

const index: {
  volume?: string;
  number?: string;
  date: string;
  url: string;
  title: string;
  filename: string;
}[] = [];

const getTitle = ({
  volume,
  number,
  date,
  item,
  group,
}: {
  volume?: string;
  number?: string;
  date?: string;
  item: (typeof volumes)[number]['values'][number];
  group: (typeof volumes)[number];
}) => {
  const volumeString = volume ? `vol. ${volume}` : group.key;
  const numberKey = number ? `no. ${number}` : item.text;

  if (volumeString.match(/Volume Index/i)) {
    return numberKey;
  }

  return `Jamaica Journal ${volumeString}, ${numberKey}, ${date}`;
};

const main = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    devtools: true,
    args: ['--start-maximized'],
    defaultViewport: null,
  });

  // await page.goto('https://ufdc.ufl.edu/title-sets/UF00090030');
  // await page.waitForNetworkIdle();

  // await browser.close();

  for (const group of volumes) {
    const volumeNumber = group.key.match(
      /(?:Volume)s?\s*(?<number>[\-\d]+)(?!\D$)/i
    )?.groups?.number;

    for (const item of group.values) {
      const number = item.text.match(
        /(?:Number|No)s?\.?\s*(?<number>[\-\d]+)(?!\D$)/i
      )?.groups?.number;
      const audio = item.text.match(/Audio/i);

      if (audio) {
        continue;
      }

      const page = await browser.newPage();
      await page.goto(`https://ufdc.ufl.edu/UF00090030/${item.vid}/thumbs`);
      await page.waitForNetworkIdle();

      const date = await page.evaluate(
        () =>
          (document.querySelector('.volume-subheading')! as HTMLElement)
            .innerText!
      );

      const imgSrc = await page.evaluate(() => {
        return (
          [...document!.querySelectorAll('figure')!]!
            .find(el => el?.innerText.match(/Front Cover/i))
            ?.querySelector('img')!.src ||
          (
            document.querySelector(
              '.thumbnails-page__content figure img'
            ) as HTMLImageElement
          ).src
        );
      });

      await page.close();
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      const title = getTitle({volume: volumeNumber, number, date, item, group});

      const extension = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
      }[blob.type];

      if (!extension) {
        throw new Error(
          `Unknown extension for ${blob.type} from ${imgSrc} for ${item.vid}`
        );
      }

      const filename = `${convert(title)}${extension}`;
      fs.writeFile(`./.scrape/${filename}`, buffer, () => {});

      const indexItem = {
        volume: volumeNumber,
        number,
        date,
        url: `https://ufdc.ufl.edu/UF00090030/${item.vid}`,
        title,
        filename,
      };

      index.push(indexItem);
      console.log(indexItem);
    }
  }

  await browser.close();

  fs.writeFile(`./.scrape/index.json`, JSON.stringify(index), () => {});
};

main();
