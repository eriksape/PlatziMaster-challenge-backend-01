const Redis = require('ioredis');
const redis = new Redis({host: 'redis'});

module.exports = {
  Query: {
    getTweets: async () => {
      let tweets = [];
      try {
        const Redis = require('ioredis');
        const redis = new Redis({host: 'redis'});

        tweets = (await redis.lrange('tweets', 0, -1)).map(tweet => JSON.parse(tweet));
      } catch (error) {
        console.log(error);
      }
      return tweets;
    },

  },
};
