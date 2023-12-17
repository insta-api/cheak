const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.redirect('https://insta-loader519.web.app/');
});

app.post('/download', async (req, res) => {
    let browser;

    try {
        const postUrl = req.body.postUrl;

        if (!postUrl) {
            return res.status(400).json({ error: 'Invalid post URL.' });
        }

        // Launch Puppeteer with Firefox
        const browser = await puppeteer.launch({
            executablePath: './chromium-bin/chrome.exe', // Adjust the path accordingly
            headless: true,
        });

        const page = await browser.newPage();

        // Navigate to the Instagram post URL
        await page.goto(postUrl);
        await page.waitForTimeout(5000);

        const videoTagContent = await page.evaluate(() => {
            const videoTag = document.querySelector('video');
            const imageTag = document.querySelector('img');
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
