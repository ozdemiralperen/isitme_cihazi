const express = require('express');
const router = express.Router();
const { Order, User, Product, Appointment } = require('../models');
const adminAuth = require('../middleware/auth');

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

// Kullanıcı güncelle
router.put('/users/:id', adminAuth, async (req, res) => {
    try {
        const updateData = req.body;
        delete updateData.password; // Şifre güncellemeyi bu endpoint üzerinden yapmayalım

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

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
            message: 'Kullanıcı güncellenemedi'
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
            { status: newStatus },
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            user: updatedUser,
            message: 'Kullanıcı durumu güncellendi'
        });

    } catch (error) {
        console.error('Kullanıcı durumu güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı durumu güncellenirken bir hata oluştu'
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