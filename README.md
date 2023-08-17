# Web Scraper for Jamaica Journal

Grabs this data from the Jamaica Journal digital collection:

- Volume Number
- Number
- Date
- Image
- URL

Initial index (volumes.json) already grabbed from a React component's props on [ufdc.ufl.edu/title-sets/UF00090030](https://ufdc.ufl.edu/title-sets/UF00090030)

Indexer

```bash
yarn install && yarn index
```

Are.na uploader (needs index, ARENA_CHANNEL, and ARENA_TOKEN environment variables)

```bash
yarn upload
```
