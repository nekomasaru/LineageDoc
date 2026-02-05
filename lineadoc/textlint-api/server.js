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

// Expand flat rulesConfig (e.g., "preset/rule") into nested objects for Textlint
function expandConfig(config) {
    if (!config) return {};
    const result = {};
    for (const key in config) {
        if (key.includes('/')) {
            const parts = key.split('/');
            const parent = parts[0];
            const child = parts.slice(1).join('/'); // Support deeper nested if any

            if (!result[parent]) result[parent] = {};
            // If it's a boolean, we just toggle it. 
            // Note: This might overwrite existing objects in the parent preset.
            result[parent][child] = config[key];
        } else {
            result[key] = config[key];
        }
    }
    return result;
}

// Convert customDictionary array to PRH YAML format
function convertToPrh(customDictionary) {
    if (!customDictionary || !Array.isArray(customDictionary) || customDictionary.length === 0) {
        return null;
    }

    let yaml = 'version: 1\nrules:\n';
    customDictionary.forEach(item => {
        if (item.enabled !== false && item.pattern) {
            yaml += `  - expected: ${item.expected || item.pattern}\n    pattern: ${item.pattern}\n`;
        }
    });
    return yaml;
}

// Textlint Engine Factory
function createEngine(rulesConfig = {}, customDictionary = []) {
    const expanded = expandConfig(rulesConfig);

    // Inject custom dictionary into prh rule if present
    const customPrhYaml = convertToPrh(customDictionary);
    if (customPrhYaml) {
        if (!expanded.prh) expanded.prh = {};
        if (!expanded.prh.ruleContents) expanded.prh.ruleContents = [];
        expanded.prh.ruleContents.push(customPrhYaml);
    }

    return new TextLintEngine({
        configFile: './.textlintrc.json',
        rulesConfig: expanded
    });
}

// Default engine for cache misses with no custom config
let defaultEngine;
function getDefaultEngine() {
    if (!defaultEngine) {
        defaultEngine = createEngine();
    }
    return defaultEngine;
}

// Generate Cache Key including rulesConfig hash and customDictionary hash
function getCacheKey(text, rulesConfig = {}, customDictionary = []) {
    const configStr = JSON.stringify(rulesConfig) + JSON.stringify(customDictionary);
    const configHash = crypto.createHash('md5').update(configStr).digest('hex').substring(0, 8);
    const textHash = crypto.createHash('md5').update(text).digest('hex');
    return `textlint:${configHash}:${textHash}`;
}

// Lint Endpoint
app.post('/api/lint', async (req, res) => {
    try {
        const { text, rulesConfig, customDictionary } = req.body;

        if (text === undefined || typeof text !== 'string') {
            return res.status(400).json({ error: 'text is required' });
        }

        if (text.length > 100000) {
            return res.status(400).json({
                error: 'Text too long (max 100,000 chars)'
            });
        }

        const cacheKey = getCacheKey(text, rulesConfig, customDictionary);

        // Check Cache
        const cached = await getFromCache(cacheKey);
        if (cached) {
            const result = typeof cached === 'string' ? JSON.parse(cached) : cached;
            return res.json(result);
        }

        // Run textlint
        const startTime = Date.now();

        // Use custom engine if rulesConfig or customDictionary is provided
        let currentEngine;
        if ((rulesConfig && Object.keys(rulesConfig).length > 0) || (customDictionary && customDictionary.length > 0)) {
            currentEngine = createEngine(rulesConfig, customDictionary);
        } else {
            currentEngine = getDefaultEngine();
        }

        const results = await currentEngine.executeOnText(text);

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
