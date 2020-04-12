require('dotenv').config();
const amqp = require('amqplib/callback_api');
const Twit = require('twit');
 
const T = new Twit({
  consumer_key:         process.env.CONSUMER_KEY,
  consumer_secret:      process.env.CONSUMER_SECRET,
  access_token:         process.env.ACCESS_TOKEN,
  access_token_secret:  process.env.ACCESS_TOKEN_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
});

function encode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

amqp.connect('amqp://rabbitmq', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    const track = 'hola';
    var queue = `twit/${track}`;

    channel.assertQueue(queue, {
      durable: false
    });

    const stream = T.stream('statuses/filter', { track });
    stream.on('tweet', function (tweet) {
      const msg = encode_utf8(JSON.stringify(tweet));
      channel.sendToQueue(queue, Buffer.from(msg));
      console.log(" [x] Sent Tweet %s", tweet.text);
    });
    
  });
});