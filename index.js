require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const fs = require('fs');
const app = express();

const port = process.env.PORT || 3000;
const DB_FILE = './urls.json';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { counter: 1, urls: {} };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db));
}

app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;

  let hostname;
  try {
    hostname = new URL(originalUrl).hostname;
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, function(err) {
    if (err) {
      return res.json({ error: 'invalid url' });
    }
    const db = loadDB();
    const shortUrl = db.counter++;
    db.urls[shortUrl] = originalUrl;
    saveDB(db);
    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = parseInt(req.params.short_url);
  const db = loadDB();
  const originalUrl = db.urls[shortUrl];

  if (!originalUrl) {
    return res.json({ error: 'No short URL found' });
  }

  res.redirect(originalUrl);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});