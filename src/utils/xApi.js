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
   * Posts a text-only tweet
   * @param {string} tweetText The body of the tweet
   */
  async postTweet(tweetText) {
    console.log('Publishing tweet via X API (V2)...');
    const result = await this.client.v2.tweet({ text: tweetText });
    console.log('Tweet published successfully! ID:', result.data.id);
    return result;
  }
}

module.exports = new XApiManager();

