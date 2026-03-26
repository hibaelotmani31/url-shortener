require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');
const app = express();

const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI);

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const Url = mongoose.model('Url', urlSchema);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async function(req, res) {
  const originalUrl = req.body.url;

  let hostname;
  try {
    hostname = new URL(originalUrl).hostname;
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, async function(err) {
    if (err) {
      return res.json({ error: 'invalid url' });
    }
    const count = await Url.countDocuments();
    const shortUrl = count + 1;
    const newUrl = new Url({ original_url: originalUrl, short_url: shortUrl });
    await newUrl.save();
    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  const shortUrl = parseInt(req.params.short_url);
  const found = await Url.findOne({ short_url: shortUrl });

  if (!found) {
    return res.json({ error: 'No short URL found' });
  }

  res.redirect(found.original_url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});