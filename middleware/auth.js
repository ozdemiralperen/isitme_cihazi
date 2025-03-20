const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Yetkisiz erişim'
        });
    }
    
    try {
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
        res.status(401).json({
            success: false,
            message: 'Geçersiz token'
        });
    }
};

module.exports = adminAuth;