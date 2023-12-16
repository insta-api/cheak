const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 8080;

app.use(cors());

app.get('/', (req, res) => {
    res.redirect('http://localhost:3000');
});

app.get('/download/:postUrl', async (req, res) => {
    let browser; // Declare the browser variable outside the try block

    try {
        const postUrl = req.params.postUrl;
        browser = await puppeteer.launch({ headless: 'new' }); // Explicitly set headless mode to "new"
        const page = await browser.newPage();

        // Navigate to the Instagram post URL
        await page.goto(postUrl); // Use the dynamic postUrl variable

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
        // Close the browser when done
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
