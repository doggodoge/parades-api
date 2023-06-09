import express, { Request, Response } from 'express';
import path from 'path';
import { ParadeDetails, allParades, parseParadesDetailsHTML } from './parsing';
import LRUCache from './lru';

const cache = new LRUCache<string, ParadeDetails>(1000);

// Create an instance of the Express application
const app = express();
app.set('trust proxy', 1);

// Define routes
app.get('/', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'index.html');
  res.sendFile(filePath);
});

type ParadeQueryParams = {
  location: string;
  start: string;
  end: string;
};

app.get('/parade', async (req: Request, res: Response) => {
  const queryParams: ParadeQueryParams = req.query as ParadeQueryParams;
  const { location, start, end } = queryParams;
  console.log('queryParams', queryParams);
  let parades = await allParades();
  console.log(parades);

  if (location) {
    parades = parades.filter((p) => p.town.toLowerCase().includes(location.toLowerCase()));
  }
  if (start && end) {
    parades = parades.filter((p) => p.date >= start && p.date <= end);
  }

  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(parades));
});

app.get('/parades_by_street_belfast/:street', async (req: Request, res: Response) => {
  const street: string = decodeURIComponent(req.params.street);
  const parades = await allParades();

  const paradeURLs = parades
    .filter((p) => p.town.toLowerCase() === 'belfast')
    .map((p) => p.detailsUrl);

  const parsedParadeDetails = await Promise.all(
    paradeURLs.map(async (url) => {
      const cachedEntry = cache.get(url);
      if (cachedEntry) {
        console.log('cache hit');
        return cachedEntry;
      }
      console.log('cache miss');
      return fetch(url)
        .then((response) => response.text())
        .then((html) => {
          const parsedParadeDetails = parseParadesDetailsHTML(html);
          cache.put(url, parsedParadeDetails);
          return parsedParadeDetails;
        });
    }),
  );

  const paradesByStreet = parsedParadeDetails.filter(
    (parade) =>
      typeof parade.proposedOutwardRoute === 'string' &&
      parade.proposedOutwardRoute.toLowerCase().includes(street.toLowerCase()),
  );

  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(paradesByStreet));
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
