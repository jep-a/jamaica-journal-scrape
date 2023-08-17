import index from './.scrape/index.json';
import 'dotenv/config';

const main = async () => {
  for (const number of [...index].reverse()) {
    try {
      const res = await fetch(
        `https://api.are.na/v2/channels/${process.env.ARENA_CHANNEL}/blocks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.ARENA_TOKEN}`,
          },
          body: JSON.stringify({
            source: number.imageUrl,
            title: number.title,
            original_source_title: number.url.replace('https://', ''),
            original_source_url: number.url,
          }),
        }
      );

      if (res.status !== 200) {
        throw new Error(`Failed to upload ${await res.text()}`);
      }
    } catch (err) {
      throw err;
    }

    console.log(`Uploaded ${number.title}`);
  }
};

main();
