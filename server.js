const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const PORT = 8080;

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

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.redirect('https://insta-loader519.web.app/');
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
    
    const ipAddress = req.clientIp;
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
   
    try {
        let postUrl = req.body.postUrl;
        let deviceDetail = req.body.device;

        if (postUrl.includes('/?')) {
            postUrl = postUrl.split('/?')[0];
        }

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

        if (!postUrl) {
            return res.status(400).json({ error: 'Invalid post URL.' });
        }

        browser = await puppeteer.launch({ headless: 'new' });
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
