const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Set the path to your Google Drive folder
const googleDrivePath = 'https://drive.google.com/drive/folders/15EV9gaNooeEnE03fRdi3Fluc7Im6V9fv'; // Update this to your actual Google Drive folder path

// Scrape anime data from anitaku.se
async function scrapeAnimeData() {
  const baseUrl = 'https://anitaku.se';
  const targetEndpoint = '/popular.html';
  const fullUrl = `${baseUrl}${targetEndpoint}`;

  const html = await axios.get(fullUrl);
  const $ = cheerio.load(html.data);

  const animeData = [];

  // Create a folder for storing images in Google Drive
  const imageFolder = path.join(googleDrivePath, 'images');
  if (!fs.existsSync(imageFolder)) {
    fs.mkdirSync(imageFolder, { recursive: true });
  }

  $('.anime-item').each((index, element) => {
    const imageUrl = $(element).find('img').attr('src');
    const animeUrl = $(element).find('a').attr('href');
    const fullAnimeUrl = `${baseUrl}${animeUrl}`;
    if (imageUrl && animeUrl) {
      animeData.push({
        image: imageUrl,
        url: fullAnimeUrl,
      });
    }
  });

  // Save the JSON data directly to Google Drive
  const jsonFilePath = path.join(googleDrivePath, 'animeData.json');
  fs.writeFileSync(jsonFilePath, JSON.stringify(animeData, null, 2), 'utf-8');
  console.log('Anime data scraped and saved to Google Drive in animeData.json');

  // Download and save each image to Google Drive
  for (const anime of animeData) {
    const imageFileName = path.basename(anime.image);
    const localImagePath = path.join(imageFolder, imageFileName);

    // Download the image
    await downloadImage(anime.image, localImagePath);
    console.log(`Image downloaded and saved to Google Drive: ${imageFileName}`);
  }
}

// Download image from the web
async function downloadImage(url, dest) {
  const writer = fs.createWriteStream(dest);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Main function
async function main() {
  await scrapeAnimeData();
}

main().catch(console.error);
        
