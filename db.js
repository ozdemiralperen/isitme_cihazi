const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

// Mongoose bağlantı seçenekleri
const options = {
  connectTimeoutMS: 30000,      // Bağlantı zaman aşımı
  socketTimeoutMS: 45000,       // Soket zaman aşımı
  serverSelectionTimeoutMS: 30000,  // Sunucu seçimi zaman aşımı
  maxPoolSize: 50,              // Maksimum bağlantı havuzu boyutu
  retryWrites: true,            // Yazma işlemlerini yeniden deneme
};

// Bağlantı durumunu izleme
mongoose.connection.on('connected', () => {
  console.log('MongoDB bağlantısı başarılı');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB bağlantısı kesildi');
});

// Bağlantıyı kurma fonksiyonu
async function connectDB() {
  try {
    await mongoose.connect(uri, options);
    
    // Bağlantıyı test et
    const connection = mongoose.connection;
    await connection.db.admin().ping();
    console.log("Veritabanına bağlantı tamamen hazır - İsitTech DB");
    
    return connection;
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err);
    console.log("Yeniden bağlanmayı deniyorum...");
    // Hata durumunda yeniden bağlanmayı dene
    setTimeout(() => connectDB(), 5000); // 5 saniye sonra tekrar dene
  }
}

// Mevcut bağlantıyı döndüren yardımcı fonksiyon
function getConnection() {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    throw new Error("Veritabanı bağlantısı henüz kurulmadı veya hata durumunda. Önce connectDB() fonksiyonunu çağırın.");
  }
  return mongoose.connection;
}

// Uygulama kapatılırken bağlantıyı kapat
process.on('SIGINT', async () => {
  if (mongoose.connection) {
    console.log('MongoDB bağlantısı kapatılıyor...');
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
  process.exit(0);
});

// Beklenmeyen hatalar için olay dinleyicisi
process.on('unhandledRejection', (reason, promise) => {
  console.error('Yakalanmamış Promise hatası:', reason);
  // Uygulamayı çökertmek yerine loglayalım
});

module.exports = { connectDB, getConnection };