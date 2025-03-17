const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

class SecurityService {
    constructor() {
        this.saltRounds = 10;
        this.tokenBlacklist = new Set();
    }

    async hashPassword(password) {
        return await bcrypt.hash(password, this.saltRounds);
    }

    async comparePasswords(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    generateToken(payload, expiresIn = '24h') {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn }
        );
    }

    verifyToken(token) {
        if (this.tokenBlacklist.has(token)) {
            throw new Error('Token has been revoked');
        }
        return jwt.verify(token, process.env.JWT_SECRET);
    }

    revokeToken(token) {
        this.tokenBlacklist.add(token);
        // Clean up old tokens periodically
        if (this.tokenBlacklist.size > 1000) {
            this.cleanupTokenBlacklist();
        }
    }

    async cleanupTokenBlacklist() {
        const validTokens = new Set();
        for (const token of this.tokenBlacklist) {
            try {
                jwt.verify(token, process.env.JWT_SECRET);
                validTokens.add(token);
            } catch (error) {
                // Token is expired or invalid, don't add to new set
            }
        }
        this.tokenBlacklist = validTokens;
    }

    generateSecureId(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    sanitizeInput(input) {
        // Basic XSS prevention
        if (typeof input === 'string') {
            return input
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }
        return input;
    }

    validatePassword(password) {
        // Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    generateCSRFToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    validateCSRFToken(token, storedToken) {
        return crypto.timingSafeEqual(
            Buffer.from(token),
            Buffer.from(storedToken)
        );
    }
}

module.exports = new SecurityService(); 