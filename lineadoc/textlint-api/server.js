const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const crypto = require('crypto');
const { TextLintEngine } = require('textlint');

const app = express();

// Redis setup with in-memory fallback for local development
let redis = null;
const useRedis = process.env.USE_REDIS === 'true';

if (useRedis) {
    redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        // Fail fast locally if not available
        retryStrategy: (times) => {
            if (process.env.NODE_ENV !== 'production' && times > 3) {
                console.warn('Redis connection failed, switching to in-memory cache.');
                return null; // Stop retrying
            }
            return Math.min(times * 50, 2000);
        }
    });

    redis.on('error', (err) => {
        console.warn('Redis error:', err.message);
    });
}

// Simple in-memory cache for fallback
const memoryCache = new Map();

// CORS Settings
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'production' ? 60 : 1000, // Higher limit for dev
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);

// Textlint Engine Singleton
let engine;
function getEngine() {
    if (!engine) {
        engine = new TextLintEngine({
            configFile: './.textlintrc.json'
        });
    }
    return engine;
}

// Generate Cache Key
function getCacheKey(text) {
    return `textlint:${crypto.createHash('md5').update(text).digest('hex')}`;
}

// Cache Wrapper
async function getFromCache(key) {
    if (redis && redis.status === 'ready') {
        return await redis.get(key);
    }
    return memoryCache.get(key);
}

async function setCache(key, value, ttlSeconds) {
    if (redis && redis.status === 'ready') {
        await redis.setex(key, ttlSeconds, value);
    } else {
        memoryCache.set(key, value);
        // Simple TTL for memory cache (no cleanup loop for simplicity in this MVP)
        setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
    }
}

// Lint Endpoint
app.post('/api/lint', async (req, res) => {
    try {
        const { text } = req.body;

        if (text === undefined || typeof text !== 'string') {
            return res.status(400).json({ error: 'text is required' });
        }

        if (text.length > 100000) {
            return res.status(400).json({
                error: 'Text too long (max 100,000 chars)'
            });
        }

        const cacheKey = getCacheKey(text);

        // Check Cache
        const cached = await getFromCache(cacheKey);
        if (cached) {
            // console.log('Cache hit:', cacheKey); // Verbose logging off
            const result = typeof cached === 'string' ? JSON.parse(cached) : cached;
            return res.json(result);
        }

        // Run textlint
        // console.log('Cache miss, running textlint...');
        const startTime = Date.now();

        const engine = getEngine();
        const results = await engine.executeOnText(text);

        const response = {
            errors: results[0].messages.map(msg => ({
                ruleId: msg.ruleId,
                message: msg.message,
                line: msg.line,
                column: msg.column,
                severity: msg.severity === 2 ? 'error' :
                    msg.severity === 1 ? 'warning' : 'suggestion',
                fix: msg.fix
            })),
            processingTime: Date.now() - startTime
        };

        // Save to Cache (TTL: 10 minutes)
        await setCache(cacheKey, JSON.stringify(response), 600);

        res.json(response);
    } catch (error) {
        console.error('Lint error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`textlint API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
