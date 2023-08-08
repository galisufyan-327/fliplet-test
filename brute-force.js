const express = require('express');
const ExpressBrute = require('express-brute');

const bruteForceMap = new Map();
const VALID_HTTP_CODES = [400, 401, 402, 403, 404, 405, 406, 422, 429, 500, 501, 502, 503, 504]

/**
 *
 * @param {string} namespace
 * @param {number} freeRetries
 * @param {number} minWait
 * @returns {ExpressBrute}
 */
function useOrCreateBruteForce(namespace, freeRetries, minWait) {
    if (bruteForceMap.has(namespace)) return bruteForceMap.get(namespace);

    const store = new ExpressBrute.MemoryStore();
    const bruteforce = new ExpressBrute(store, {
        freeRetries,
        minWait,
    });

    bruteForceMap.set(namespace, bruteforce);
    return bruteforce;
}

/**
 *
 * @param {string} name
 * @param {number} freeRetries
 * @param {number} minWait
 * @returns
 */
function bruteforceMiddleware(name, freeRetries, minWait) {
    const bruteforce = useOrCreateBruteForce(name, freeRetries, minWait);

    return (req, res, next) => {
        bruteforce.prevent(req, res, next, (err, data) => {
            if (err) {
                const waitTime = Math.ceil(data.nextValidRequest.getTime() / 1000 / 60);
                return res.status(429).send(
                    `Too many requests for the ${name} namespace. Please retry in ${waitTime} minutes`
                );
            }
            next();
        });
    };
}

async function asyncBruteForce(name, freeRetries, minWait, req, res) {
    return new Promise((resolve, reject) => {
        bruteforceMiddleware(name, freeRetries, minWait)(req, res, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 *
 * @param {number} code
 * @returns
 */
const checkIfCodeIsValid = (code) => {
    return VALID_HTTP_CODES.includes(code) ? code : 500;
}

const app = express();

app.use(bruteforceMiddleware('global', 100, 5));

const router = express.Router();

router.get('/v1/users', bruteforceMiddleware('users', 50, 1), (_req, res) => {
    res.send({ message: "send resource" })
});

router.get('/v1/apps', async function (req, res) {
    try {
        await asyncBruteForce('apps', 30, 2, req, res)
        res.status(200).send({ message: "Source " })
    } catch (err) {
        res.status(checkIfCodeIsValid(err.code)).send(err.message);
    }
});

app.use('/api', router);

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});