const jwt = require('jsonwebtoken');

// User authentication middleware
const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.header('x-auth-token');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Erişim tokeni bulunamadı'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Geçersiz token'
        });
    }
};

// Admin authentication middleware
const adminAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.header('x-auth-token');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Yetkisiz erişim'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        if (!decoded.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin yetkisi gerekli'
            });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Geçersiz token'
        });
    }
};

module.exports = { auth, adminAuth };