const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const fetchuser = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).json({ error: 'Please authenticate with valid token' });
    }

    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next();
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ error: 'Error fetching user details' });
    }
}

module.exports = fetchuser;