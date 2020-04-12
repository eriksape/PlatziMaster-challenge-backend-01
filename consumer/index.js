const amqp = require('amqplib/callback_api');
const redis = require("redis");

function decode_utf8(s) {
  return decodeURIComponent(escape(s));
}

const client = redis.createClient({
  host: 'redis'
});
      
client.on("error", function(error) {
  console.error(error);
});

amqp.connect('amqp://rabbitmq', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    var queue = 'twit/hola';

    channel.assertQueue(queue, {
      durable: false
    });

    
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
    channel.consume(queue, function(msg) {
      const tweet = JSON.parse(decode_utf8(msg.content.toString()))
      console.log(" [x] Received %s", tweet.text);
      client.set("tweet", JSON.stringify(tweet), redis.print);

    }, {
        noAck: true
      });


  });
});