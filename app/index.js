const url = require('url');
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World! to you!'));

app.get('/api/tweets', async (req, res) => {
    try {
        const fullUrl = req.protocol + '://' + req.get('host') + url.parse(req.url).pathname;
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

            redis.disconnect();
    
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
            const id_tweets = (await redis.lrange(`tweets/${req.query.keyword}`, from - 1, to -1));
            const total = await redis.llen(`tweets/${req.query.keyword}`);
            const last_page = Math.ceil(total/per_page);
            const tweets = [];
            for(let i in id_tweets) {
                console.log(id_tweets[i]);
                const tweet = await redis.lindex('tweets', id_tweets[i] - 1);
                tweets.push(JSON.parse(tweet));
            }
            
            redis.disconnect();

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

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));