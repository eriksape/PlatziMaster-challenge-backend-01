require('dotenv').config();
const amqp = require('amqplib/callback_api');
const Twit = require('twit');
 
const T = new Twit({
  consumer_key:         process.env.CONSUMER_KEY,
  consumer_secret:      process.env.CONSUMER_SECRET,
  access_token:         process.env.ACCESS_TOKEN,
  access_token_secret:  process.env.ACCESS_TOKEN_SECRET,
  timeout_ms:           60*1000,
  strictSSL:            true,
});

function encode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

const keywords = [
  {track: 'platzi', keyword: 'platzi'},
  {track: 'opensource', keyword: 'opensource'},
  {track: 'node', keyword: 'node.js'}
];


amqp.connect('amqp://rabbitmq', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }

    for(let keyword in keywords){
      const track = keywords[keyword].track;
      var queue = `twit/${track}`;

      channel.assertQueue(queue, {
        durable: false
      });

      const stream = T.stream('statuses/filter', { track: keywords[keyword].keyword });
      stream.on('tweet', function (tweet) {
        tweet.keyword = track;
        const msg = encode_utf8(JSON.stringify(tweet));
        channel.sendToQueue(queue, Buffer.from(msg));
        console.log(" [x] Sent Tweet %s", tweet.id);
      });
    }
    
  });
});