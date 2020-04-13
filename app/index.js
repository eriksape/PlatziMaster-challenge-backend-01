const url = require('url');
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World! to you!'));

app.get('/tweets', async (req, res) => {
    try {
        var fullUrl = req.protocol + '://' + req.get('host') + url.parse(req.url).pathname;
        const current_page = req.query.page ? Number(req.query.page) : 1;
        const per_page = req.query.per_page ? Number(req.query.per_page) : 15;
        const from = ((current_page - 1) * per_page) + 1;
        const to = ((current_page - 1) * per_page) + per_page

        const Redis = require('ioredis');
        const redis = new Redis({host: 'redis'});

        if(typeof req.query.keyword === "undefined") {
            const tweets = (await redis.lrange('tweets', from - 1, to -1)).map(tweet => JSON.parse(tweet));
            const total = await redis.llen('tweets');
            const last_page = Math.ceil(total/per_page);
    
            res.json({
                total,
                per_page,
                current_page,
                last_page,
                first_page_url: `${fullUrl}?page=1`,
                last_page_url: `${fullUrl}?page=${last_page}`,
                next_page_url: current_page < last_page ? `${fullUrl}?page=${current_page + 1}` : null,
                prev_page_url: current_page > 1 ? `${fullUrl}?page=${current_page - 1}` : null,
                from,
                to,
                data: tweets,
            });
        }
        else if(req.query.keyword && ['platzi','opensource', 'node'].includes(req.query.keyword)) {
            const id_tweets = (await redis.hscan('hashtweets', 0, 'match', `${req.query.keyword}*`))[1].filter(
                key => Number.isInteger(Number(key))
            );
            const total = id_tweets.length;
            const last_page = Math.ceil(total/per_page);
            const tweets = [];
            for(let i = from - 1; i < to; i++) {
                const tweet = await redis.lindex('tweets', id_tweets[i]);
                tweets.push(JSON.parse(tweet));
            }
            res.json({
                total,
                per_page,
                current_page,
                last_page,
                first_page_url: `${fullUrl}?page=1&keyword=${req.query.keyword}`,
                last_page_url: `${fullUrl}?page=${last_page}&keyword=${req.query.keyword}`,
                next_page_url: current_page < last_page ? `${fullUrl}?page=${current_page + 1}&keyword=${req.query.keyword}` : null,
                prev_page_url: current_page > 1 ? `${fullUrl}?page=${current_page - 1}&keyword=${req.query.keyword}` : null,
                from,
                to,
                data: tweets,
            });
        } else {
            res.status(303).json({message: 'keyword permited (platzi, node or opensource)'});
        }

        
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.get('/refactor', async (req, res) => {
    const Redis = require('ioredis');
    const redis = new Redis({host: 'redis'});

    const tweets = (await redis.lrange('tweets', 0,-1)).map(tweet => JSON.parse(tweet));

    for(let key in tweets) {
        redis.hset('hashtweets', `${tweets[key].keyword}_${tweets[key].id}`, key);
    }

    res.send('finished refactoring')
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));