const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Contact = require('../models/contact');
const Product = require('../models/product');
const User = require('../models/user');
const appointmentRoutes = require('./appointmentRoutes');

// Randevu rotalarını ekle
router.use(appointmentRoutes);

// İletişim formu verilerini kaydetme
router.post('/contact', async (req, res) => {
    try {
        const contactData = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            subject: req.body.subject,
            message: req.body.message,
            createdAt: new Date()
        };

        const result = await Contact.create(contactData);
        res.status(201).json({
            success: true,
            message: 'Mesajınız başarıyla gönderildi.'
        });
    } catch (error) {
        console.error('Mesaj kaydetme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Bir hata oluştu, lütfen daha sonra tekrar deneyin.'
        });
    }
});

// Tüm ürünleri getiren test endpoint'i - hata ayıklama için
router.get('/test-products', async (req, res) => {
    try {
        const products = await Product.find().lean();
        console.log('Test endpoint - bulunan ürünler:', products.length);
        res.json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error('Test ürünleri getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Test ürünleri yüklenirken bir hata oluştu',
            error: error.message
        });
    }
});

// Ürünleri getir
router.get('/products', async (req, res) => {
    try {
        // Query parametreleri
        const category = req.query.category || 'all';
        const sort = req.query.sort || 'featured';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Sorgu loglama
        console.log('Ürün sorgulama parametreleri:', { category, sort, page, limit, skip });

        // Filtreleme sorgusu
        const query = {};
        if (category !== 'all') {
            query.category = category;
        }

        // Sıralama seçenekleri
        let sortOption = {};
        switch (sort) {
            case 'price-low':
                sortOption = { price: 1 };
                break;
            case 'price-high':
                sortOption = { price: -1 };
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'featured':
            default:
                sortOption = { featured: -1, createdAt: -1 };
                break;
        }

        // Sorgu ve sıralama logla
        console.log('MongoDB sorgusu:', { query, sortOption });

        // Önce toplam sayı kontrol edilsin
        const totalProducts = await Product.countDocuments(query);
        console.log('Toplam ürün sayısı:', totalProducts);

        if (totalProducts === 0) {
            return res.json({
                success: true,
                products: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalProducts: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                },
                message: 'Hiç ürün bulunamadı'
            });
        }

        // Ürünleri getir
        const products = await Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean();

        console.log(`${products.length} ürün bulundu`);
        
        const totalPages = Math.ceil(totalProducts / limit);

        res.json({
            success: true,
            products,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Ürünleri getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Ürünler yüklenirken bir hata oluştu',
            error: error.message
        });
    }
});

// Ürün detayını getir
router.get('/products/:id', async (req, res) => {
    try {
        console.log('Ürün detayı isteniyor, ID:', req.params.id);
        
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz ürün ID formatı'
            });
        }

        const product = await Product.findById(req.params.id).lean();
        console.log('Bulunan ürün:', product ? 'Evet' : 'Hayır');
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Ürün detay hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Ürün detayları yüklenirken bir hata oluştu',
            error: error.message
        });
    }
});

// Kategorileri getir (benzersiz kategori değerlerini döndürür)
router.get('/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        console.log('Bulunan kategoriler:', categories);
        
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Kategorileri getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kategoriler yüklenirken bir hata oluştu',
            error: error.message
        });
    }
});

module.exports = router;

// Kayıt endpoint'i
router.post('/register', async (req, res) => {
    try {
        console.log('Kayıt isteği:', req.body);
        
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Kullanıcı adı, email ve şifre gereklidir'
            });
        }
        
        // Kullanıcı zaten var mı kontrol et
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Bu email zaten kayıtlı'
            });
        }
        
        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Yeni kullanıcı oluştur
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            createdAt: new Date()
        });
        
        await newUser.save();
        console.log('Yeni kullanıcı oluşturuldu:', newUser._id);
        
        res.status(201).json({
            success: true,
            message: 'Kullanıcı başarıyla oluşturuldu'
        });
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Giriş endpoint'i
router.post('/login', async (req, res) => {
    try {
        console.log('Giriş isteği:', req.body);
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email ve şifre gereklidir'
            });
        }
        
        // Kullanıcıyı bul
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz kimlik bilgileri'
            });
        }
        
        // Şifreyi kontrol et
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz kimlik bilgileri'
            });
        }
        
        // JWT token oluştur
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );
        
        console.log('Kullanıcı girişi başarılı:', user._id);
        
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Korumalı rota örneği - Profil bilgilerini getir
router.get('/user-profile', async (req, res) => {
    try {
        // Token'ı header'dan al
        const token = req.header('x-auth-token');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Erişim tokeni bulunamadı'
            });
        }
        
        try {
            // Token'ı doğrula
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
            
            // Kullanıcıyı bul
            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }
            
            res.json({
                success: true,
                user
            });
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token'
            });
        }
    } catch (error) {
        console.error('Profil bilgileri getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

module.exports = router;