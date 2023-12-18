const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');


const app = express();
const PORT = 8080;

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.redirect('https://insta-loader519.web.app/');
});

const installCommand =
        'apt-get update && ' +
        'apt-get install -y wget gnupg && ' +
        'wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && ' +
        'sh -c \'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list\' && ' +
        'apt-get update && ' +
        'apt-get install -y google-chrome-stable';

    exec(installCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (stderr) {
            console.error(`Error: ${stderr}`);
            res.status(500).send('Internal Server Error');
            return;
        }

        console.log(`Chrome installation output: ${stdout}`);
        res.status(200).send('Google Chrome installed successfully');
    });


app.post('/download', async (req, res) => {
    let browser;

    try {
        const postUrl = req.body.postUrl;

        if (!postUrl) {
            return res.status(400).json({ error: 'Invalid post URL.' });
        }
        const browser = await puppeteer.launch({
            args: [
              "--disable-setuid-sandbox",
              "--no-sandbox",
              "--single-process",
              "--no-zygote",
            ],
            executablePath:
              process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer.executablePath(),
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
