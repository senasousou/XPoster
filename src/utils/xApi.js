const { TwitterApi } = require('twitter-api-v2');

class XApiManager {
  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessSecret: process.env.X_ACCESS_SECRET,
    });
  }

  /**
   * Uploads multiple images and posts a tweet
   * @param {string[]} imagePaths Array of local file paths to images
   * @param {string} tweetText The body of the tweet
   */
  async postTweetWithImages(imagePaths, tweetText) {
    console.log('Uploading images to X via API...');
    const mediaIds = [];

    // Upload each image sequentially (v1.1 API)
    for (const imagePath of imagePaths) {
      console.log(`Uploading: ${imagePath}`);
      const mediaId = await this.client.v1.uploadMedia(imagePath);
      mediaIds.push(mediaId);
    }

    console.log(`Successfully uploaded ${mediaIds.length} images.`);

    // Post the tweet with attached media (v2 API)
    console.log('Publishing tweet...');
    const result = await this.client.v2.tweet({
      text: tweetText,
      media: { media_ids: mediaIds }
    });

    console.log('Tweet published successfully!', result.data.id);
    return result;
  }
}

module.exports = new XApiManager();
