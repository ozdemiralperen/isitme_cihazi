const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Token'ı header'dan al
  const token = req.header('x-auth-token');

  // Token kontrolü
  if (!token) {
    return res.status(401).json({ message: 'Erişim tokeni bulunamadı' });
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '815146479651');
    
    // User bilgisini request'e ekle
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Geçersiz token' });
  }
};