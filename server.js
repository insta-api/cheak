const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());
app.use(cors());

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://insta-loader519.web.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.options('*', cors()); // Enable preflight for all routes

app.get('/', (req, res) => {
    res.redirect('http://localhost:3000');
});

app.post('/download', async (req, res) => {
  let browser;

  try {
    const postUrl = req.body.postUrl; // Assuming you're using body-parser middleware or similar

    if (!postUrl) {
      return res.status(400).json({ error: 'Invalid post URL.' });
    }
    console.log(postUrl)
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Navigate to the Instagram post URL
    await page.goto(postUrl);
    await page.waitForTimeout(5000);

    const videoTagContent = await page.evaluate(() => {
      const videoTag = document.querySelector('video'); // Assuming there is a video tag on the page
      const imageTag = document.querySelector('img'); // Assuming there is an image tag on the page
      return videoTag ? videoTag.src : (imageTag ? imageTag.outerHTML : 'No video or image tag found');
    });

    // Send the video or image tag content as the response
    res.status(200).json({ content: videoTagContent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
