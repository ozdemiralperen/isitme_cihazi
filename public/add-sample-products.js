// Bu dosyayı veritabanına örnek ürünler eklemek için kullanabilirsiniz
// Terminalde şu komutu çalıştırın: node scripts/add-sample-products.js

require('dotenv').config();
const mongoose = require('mongoose'); // Mongoose'u import etmelisiniz
const { connectDB } = require('../db');
const Product = require('../models/product');

const sampleProducts = [
    {
        name: "Premium İşitme Cihazı",
        description: "En son teknoloji ile üretilen, çevrenizdeki sesleri net bir şekilde duymanızı sağlayan premium işitme cihazı. Gürültü filtreleme, Bluetooth bağlantısı ve uzun pil ömrü özellikleriyle hayatınızı kolaylaştırır. Hafif ve ergonomik tasarımı sayesinde uzun süreli kullanımlarda bile konfor sağlar.",
        shortDescription: "Bluetooth bağlantılı, gürültü filtreli premium işitme cihazı",
        price: 12500,
        discountPrice: 10999,
        category: "hearing-aids",
        imageUrl: "/public/images/products/hearing-aid-1.jpg",
        imageGallery: [
            "/images/products/hearing-aid-1-2.jpg",
            "/images/products/hearing-aid-1-3.jpg"
        ],
        stock: 15,
        featured: true,
        specifications: [
            { name: "Teknoloji", value: "Dijital" },
            { name: "Bluetooth", value: "Var" },
            { name: "Pil Ömrü", value: "12 saat" },
            { name: "Garanti", value: "2 yıl" },
            { name: "Ağırlık", value: "4 gram" }
        ]
    },
    {
        name: "Silikon Kulak Kalıbı",
        description: "Kulağınızın şekline özel olarak tasarlanan silikon kulak kalıbı, işitme cihazınızın performansını artırır ve kullanım konforunu maksimuma çıkarır. Yumuşak ve esnek yapısı sayesinde kulağınıza tam oturur ve uzun süre rahatsızlık vermez.",
        shortDescription: "Kişiye özel üretilen yumuşak silikon kulak kalıbı",
        price: 1800,
        category: "ear-molds",
        imageUrl: "/images/products/ear-mold-1.jpg",
        stock: 30,
        featured: true,
        specifications: [
            { name: "Malzeme", value: "Tıbbi Silikon" },
            { name: "Renk", value: "Şeffaf" },
            { name: "Kullanım Ömrü", value: "1-2 yıl" },
            { name: "Garanti", value: "6 ay" }
        ]
    },
    {
        name: "İşitme Cihazı Pili (6lı Paket)",
        description: "Yüksek kaliteli işitme cihazı pilleri, cihazınızın uzun süre çalışmasını sağlar. Paket içeriğinde 6 adet pil bulunmaktadır. Hava aktive edilmiş çinko-hava teknolojisi sayesinde yüksek enerji yoğunluğu ve uzun raf ömrü sunar.",
        shortDescription: "6 adet yüksek performanslı işitme cihazı pili",
        price: 299,
        category: "batteries",
        imageUrl: "/images/products/battery-pack.jpg",
        stock: 100,
        featured: false,
        specifications: [
            { name: "Tip", value: "Çinko-Hava" },
            { name: "Boyut", value: "13" },
            { name: "Adet", value: "6" },
            { name: "Voltaj", value: "1.4V" },
            { name: "Raf Ömrü", value: "3 yıl" }
        ]
    },
    {
        name: "İşitme Cihazı Temizleme Kiti",
        description: "İşitme cihazınızın ömrünü uzatmak ve performansını korumak için gerekli tüm temizlik araçlarını içeren kapsamlı bakım kiti. Düzenli bakım ile cihazınızın ses kalitesini ve çalışma performansını en üst düzeyde tutabilirsiniz.",
        shortDescription: "Komple işitme cihazı temizleme ve bakım seti",
        price: 450,
        discountPrice: 399,
        category: "accessories",
        imageUrl: "/images/products/cleaning-kit.jpg",
        stock: 45,
        featured: true,
        specifications: [
            { name: "İçerik", value: "Fırça, temizleme bezi, kurutma tableti, temizleme solüsyonu" },
            { name: "Kullanım", value: "Günlük bakım için" },
            { name: "Uyumluluk", value: "Tüm işitme cihazı modelleri" }
        ]
    },
    {
        name: "Reçine Baskı Kulak Kalıbı",
        description: "3D tarama teknolojisi ile alınan ölçülerle reçine baskı teknolojisi kullanılarak üretilen yüksek kaliteli kulak kalıbı. Kulağınızın anatomisine mükemmel uyum sağlar ve maksimum ses iletimi sunar.",
        shortDescription: "3D baskı teknolojisiyle üretilen özel kulak kalıbı",
        price: 2200,
        category: "ear-molds",
        imageUrl: "/images/products/resin-ear-mold.jpg",
        stock: 20,
        featured: false,
        specifications: [
            { name: "Malzeme", value: "Tıbbi Reçine" },
            { name: "Dayanıklılık", value: "2-3 yıl" },
            { name: "Özellik", value: "Su geçirmez" },
            { name: "Üretim", value: "Kişiye özel" }
        ]
    }
];

async function addSampleProducts() {
    try {
      // Veritabanına bağlan
      const conn = await connectDB();
      
      console.log('Veritabanı bağlantısı başarılı.');
      console.log('Örnek ürünler ekleniyor...');
      
      if (!mongoose.connection.readyState) {
        console.log('Veritabanı bağlantısı kurulu değil, yeniden bağlanmaya çalışılıyor...');
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 30000
        });
      }
      
      for (const product of sampleProducts) {
        const newProduct = new Product(product);
        await newProduct.save();
        console.log(`Ürün eklendi: ${product.name}`);
      }
      
      console.log('Tüm örnek ürünler başarıyla eklendi!');
      await mongoose.connection.close(); // await ile bekleyin
      process.exit(0);
    } catch (error) {
      console.error('Ürün ekleme sırasında bir hata oluştu:', error);
      if (mongoose.connection) {
        await mongoose.connection.close(); // await ile bekleyin
      }
      process.exit(1);
    }
}

// Script'i çalıştır
addSampleProducts();