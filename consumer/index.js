const amqp = require('amqplib/callback_api');
const Redis = require("ioredis");
const redis = new Redis({
  host: 'redis'
});

const keywords = [
  'platzi',
  'opensource',
  'node'
];

function decode_utf8(s) {
  return decodeURIComponent(escape(s));
}

amqp.connect('amqp://rabbitmq', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }

    for(let keyword in keywords)
    {
      const queue = `twit/${keywords[keyword]}`;

      channel.assertQueue(queue, {
        durable: false
      });
      console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
      channel.consume(queue, function(msg) {
        const tweet = JSON.parse(decode_utf8(msg.content.toString()));
        console.log(" [x] Received %s", tweet.id);
        redis.rpush('tweets', JSON.stringify(tweet)).then(index => {
          redis.rpush(`tweets/${tweet.keyword}`, index);
        });
      }, {
          noAck: true
      });
    }

  });
});