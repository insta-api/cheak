const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb+srv://whitehunter513:CfIm5yP9OiMQSg6j@ters.z8qdcrl.mongodb.net/insta-details', { useNewUrlParser: true, useUnifiedTopology: true });

const instaDataSchema = new mongoose.Schema({
    ipaddress: String,
    url: String,
    mobilename: String,
    userAgent: String,
    platform: String,
    language: String,
});

const instaData = mongoose.model('insta-datas', instaDataSchema);

app.get('/', (req, res) => {
    res.redirect('https://insta-loader519.web.app/');
});

app.get('/install', (req, res) => {
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
});

app.get('/get-os-info', (req, res) => {
    exec('which yum', (error, stdout, stderr) => {
        const yumAvailable = !error;

        const osInfo = {
            platform: os.platform(),
            type: os.type(),
            release: os.release(),
            architecture: os.arch(),
            cpus: os.cpus(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            yumAvailable: yumAvailable,
        };

        res.json(osInfo);
    });
});

app.post('/download', async (req, res) => {
    let browser;

    try {
        const postUrl = req.body.postUrl;

        if (!postUrl) {
            return res.status(400).json({ error: 'Invalid post URL.' });
        }
        else if (postUrl.includes('/?')) {
            postUrl = postUrl.split('/?')[0];
        }

        const ipAddress = req.clientIp;
        let deviceDetail = req.body.device;

        const instaDataInstance = new instaData({
            ipaddress: ipAddress,
            url: postUrl,
            mobilename: deviceDetail.mobilename,
            userAgent: deviceDetail.userAgent,
            platform: deviceDetail.platform,
            language: deviceDetail.language,
        });

        // Save the instance to the database
        await instaDataInstance.save();

        
        const browser = await puppeteer.launch({
            args: [
              "--disable-setuid-sandbox",
              "--no-sandbox",
              "--single-process",
              "--no-zygote",
            ],
            headless: 'new',
            executablePath:
              process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer.executablePath(),
          });
       
        //browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        // Navigate to the Instagram post URL
        await page.goto(postUrl);
        await page.waitForTimeout(5000);
        if (postUrl.includes('/reel')) {
            const videoTagContent = await page.evaluate(() => {
                const videoTag = document.querySelector('video');
                return videoTag ? videoTag.src : 'No reels found';
            });
            res.status(200).json({ content: videoTagContent });
        }
        else {
            const videoTagContent = await page.evaluate(() => {
                const videoTag = document.querySelector('video');
                const imageTag = document.querySelector('img');
                return videoTag ? videoTag.src : (imageTag ? imageTag.outerHTML : 'No video or image tag found');
            });
            res.status(200).json({ content: videoTagContent });
        }

        // Send the video or image tag content as the response

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
