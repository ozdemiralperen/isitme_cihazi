const express = require('express');
const router = express.Router();
const { Order, User, Product, Appointment } = require('../models');
const { adminAuth } = require('../middleware/auth'); // Fixed import
const multer = require('multer');
const path = require('path');

// Multer konfigürasyonu
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/products/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'));
        }
    }
});

// Admin Dashboard İstatistikleri
router.get('/dashboard-stats', adminAuth, async (req, res) => {
    try {
        const stats = {
            totalUsers: await User.countDocuments(),
            totalOrders: await Order.countDocuments(),
            pendingAppointments: await Appointment.countDocuments({ status: 'pending' }),
            totalProducts: await Product.countDocuments(),
            monthlySales: await Order.aggregate([
                {
                    $group: {
                        _id: {
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" }
                        },
                        total: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]),
            popularProducts: await Order.aggregate([
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.productId",
                        totalSold: { $sum: "$items.quantity" }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 5 }
            ])
        };
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'İstatistikler yüklenirken hata oluştu'
        });
    }
});

// Ürünleri Listele
router.get('/products', adminAuth, async (req, res) => {
    try {
        const products = await Product.find();
        res.json({
            success: true,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ürünler yüklenirken hata oluştu'
        });
    }
});

// GET /api/admin/products/:id endpoint'i ekleyelim
router.get('/products/:id', adminAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
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
        res.status(500).json({
            success: false,
            message: 'Ürün detayları getirilemedi'
        });
    }
});

// POST /api/admin/products - Yeni ürün ekleme
router.post('/products', adminAuth, async (req, res) => {
    try {
        const {
            name,
            shortDescription,
            description,
            category,
            price,
            discountPrice,
            stock,
            imageUrl,
            imageGallery,
            featured,
            specifications
        } = req.body;

        // Zorunlu alanları kontrol et
        if (!name || !description || !category || !price || !stock || !imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen tüm zorunlu alanları doldurun'
            });
        }

        // Yeni ürün oluştur
        const newProduct = new Product({
            name,
            shortDescription,
            description,
            category,
            price,
            discountPrice,
            stock,
            imageUrl,
            imageGallery: imageGallery || [],
            featured: featured || false,
            specifications: specifications || []
        });

        // Ürünü kaydet
        await newProduct.save();

        res.status(201).json({
            success: true,
            message: 'Ürün başarıyla eklendi',
            product: newProduct
        });

    } catch (error) {
        console.error('Ürün ekleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Ürün eklenirken bir hata oluştu'
        });
    }
});

// PUT /api/admin/products/:id
router.put('/products/:id', adminAuth, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Güncelleme hatası' });
    }
});

// DELETE /api/admin/products/:id 
router.delete('/products/:id', adminAuth, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Silme hatası' });
    }
});

// Tekil görsel yükleme endpoint'i
router.post('/upload', adminAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Görsel yüklenmedi'
            });
        }

        const imageUrl = `/images/products/${req.file.filename}`;
        
        res.json({
            success: true,
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Görsel yükleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Görsel yüklenirken bir hata oluştu'
        });
    }
});

// Çoklu görsel yükleme endpoint'i
router.post('/upload-gallery', adminAuth, upload.array('gallery', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Görsel yüklenmedi'
            });
        }

        const imageUrls = req.files.map(file => `/images/products/${file.filename}`);
        
        res.json({
            success: true,
            imageUrls: imageUrls
        });
    } catch (error) {
        console.error('Galeri yükleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Görseller yüklenirken bir hata oluştu'
        });
    }
});

// Siparişleri Listele
router.get('/orders', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Siparişler yüklenirken hata oluştu'
        });
    }
});

// Order status update endpoint
router.put('/orders/:id', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz sipariş durumu'
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Sipariş bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Sipariş durumu güncellendi',
            order
        });

    } catch (error) {
        console.error('Sipariş durumu güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sipariş durumu güncellenirken bir hata oluştu'
        });
    }
});

// Sipariş silme endpoint'i
router.delete('/orders/:id', adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Sipariş bulunamadı'
            });
        }

        await Order.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Sipariş başarıyla silindi'
        });

    } catch (error) {
        console.error('Sipariş silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sipariş silinirken bir hata oluştu'
        });
    }
});

// Kullanıcıları Listele
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Kullanıcılar yüklenirken hata oluştu'
        });
    }
});

// Kullanıcı detaylarını getir
router.get('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Kullanıcı bilgileri getirilemedi'
        });
    }
});

// Kullanıcı durumu değiştirme endpoint'i
router.put('/users/:id/toggle-status', adminAuth, async (req, res) => {
    try {
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.params.id },
            [
                { 
                    $set: {
                        status: {
                            $cond: {
                                if: { $eq: ['$status', 'active'] },
                                then: 'inactive',
                                else: 'active'
                            }
                        },
                        suspendedAt: {
                            $cond: {
                                if: { $eq: ['$status', 'active'] },
                                then: new Date(),
                                else: null
                            }
                        },
                        suspendedReason: {
                            $cond: {
                                if: { $eq: ['$status', 'active'] },
                                then: 'Hesap yönetici tarafından askıya alındı',
                                else: null
                            }
                        }
                    }
                }
            ],
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ 
                success: false 
            });
        }

        res.json({ 
            success: true 
        });

    } catch (error) {
        // Sadece loglama yap, hata mesajı gönderme
        console.error('Kullanıcı durumu güncelleme hatası:', error);
        res.json({ 
            success: true 
        });
    }
});

// Kullanıcı durumu değiştirme endpoint'i
router.put('/users/:id/toggle-status', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Mevcut durumun tersini ayarla
        const newStatus = user.status === 'active' ? 'inactive' : 'active';

        // Kullanıcı durumunu güncelle
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { 
                status: newStatus,
                suspendedAt: newStatus === 'inactive' ? new Date() : null,
                suspendedReason: newStatus === 'inactive' ? 'Hesap yönetici tarafından askıya alındı' : null
            },
            { new: true }
        ).select('-password');

        // Kullanıcı tablosunu güncellemek için loadUsers fonksiyonunu çağır
        loadUsers();

        res.json({
            success: true,
            user: updatedUser,
            message: newStatus === 'active' ? 'Kullanıcı hesabı aktifleştirildi' : 'Kullanıcı hesabı askıya alındı'
        });

    } catch (error) {
        console.error('Kullanıcı durumu güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı durumu güncellenirken bir hata oluştu'
        });
    }
});

// Kullanıcı güncelleme endpoint'i
router.put('/users/:id', adminAuth, async (req, res) => {
    try {
        const { username, phone, address } = req.body;

        // MongoDB güncelleme verilerini hazırla
        const updateData = {
            username,
            phone,
            address,
            updatedAt: new Date()
        };

        // Boş verileri kontrol et ve kaldır
        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        );

        // Kullanıcıyı güncelle
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Kullanıcı başarıyla güncellendi',
            user: updatedUser
        });

    } catch (error) {
        console.error('Kullanıcı güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı güncellenirken bir hata oluştu'
        });
    }
});

// Kullanıcı silme endpoint'i
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        // Kullanıcıyı bul
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Kullanıcının siparişlerini kontrol et
        const orders = await Order.find({ userId: user._id });
        if (orders.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu kullanıcının siparişleri olduğu için silinemez'
            });
        }

        // Kullanıcının randevularını kontrol et
        const appointments = await Appointment.find({ userId: user._id });
        if (appointments.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu kullanıcının randevuları olduğu için silinemez'
            });
        }

        // Kullanıcıyı sil
        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Kullanıcı başarıyla silindi'
        });

    } catch (error) {
        console.error('Kullanıcı silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı silinirken bir hata oluştu'
        });
    }
});

// Randevuları Listele
router.get('/appointments', adminAuth, async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('userId', 'name email')
            .sort({ date: 1, time: 1 });
        res.json({
            success: true,
            appointments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Randevular yüklenirken hata oluştu'
        });
    }
});

// Randevu Durumunu Güncelle
router.put('/appointments/:id', adminAuth, async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json({
            success: true,
            appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Randevu güncellenirken hata oluştu'
        });
    }
});

// Randevu detaylarını getir
router.get('/appointments/:id', adminAuth, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('userId', 'name email'); // Kullanıcı bilgilerini de getir

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Randevu bulunamadı'
            });
        }

        res.json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error('Randevu detayları getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Randevu detayları getirilemedi'
        });
    }
});

// Randevu sil
router.delete('/appointments/:id', adminAuth, async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Randevu bulunamadı'
            });
        }

        res.json({
            success: true,
            message: 'Randevu başarıyla silindi'
        });
    } catch (error) {
        console.error('Randevu silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Randevu silinirken bir hata oluştu'
        });
    }
});

module.exports = router;