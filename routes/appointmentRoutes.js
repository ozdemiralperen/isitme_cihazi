const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment');
const jwt = require('jsonwebtoken');

// Kullanıcı kimlik doğrulaması için ara yazılım
const auth = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Erişim tokeni bulunamadı'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Geçersiz token'
        });
    }
};

// Randevu oluşturma
router.post('/appointments', auth, async (req, res) => {
    try {
        const { date, time, service, notes } = req.body;
        
        if (!date || !time || !service) {
            return res.status(400).json({
                success: false,
                message: 'Tarih, saat ve hizmet bilgileri zorunludur'
            });
        }
        
        const newAppointment = new Appointment({
            userId: req.userId,
            date,
            time,
            service,
            notes,
            status: 'beklemede'
        });
        
        await newAppointment.save();
        
        res.status(201).json({
            success: true,
            message: 'Randevu başarıyla oluşturuldu',
            appointment: newAppointment
        });
    } catch (error) {
        console.error('Randevu oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Kullanıcının randevularını getirme
router.get('/appointments', auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({ userId: req.userId })
            .sort({ date: 1, time: 1 })
            .lean();
        
        res.json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error('Randevu getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Randevu iptal etme/güncelleme
router.put('/appointments/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time, service, notes, status } = req.body;
        
        const appointment = await Appointment.findOne({ _id: id, userId: req.userId });
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Randevu bulunamadı'
            });
        }
        
        // Randevu bilgilerini güncelle
        if (date) appointment.date = date;
        if (time) appointment.time = time;
        if (service) appointment.service = service;
        if (notes !== undefined) appointment.notes = notes;
        if (status) appointment.status = status;
        
        await appointment.save();
        
        res.json({
            success: true,
            message: 'Randevu başarıyla güncellendi',
            appointment
        });
    } catch (error) {
        console.error('Randevu güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Randevu silme
router.delete('/appointments/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const appointment = await Appointment.findOne({ _id: id, userId: req.userId });
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Randevu bulunamadı'
            });
        }
        
        await Appointment.deleteOne({ _id: id });
        
        res.json({
            success: true,
            message: 'Randevu başarıyla silindi'
        });
    } catch (error) {
        console.error('Randevu silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Müsait saatleri getirme (örnek)
router.get('/available-times', auth, async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Tarih bilgisi gereklidir'
            });
        }
        
        // Burada gerçek bir veritabanı sorgusu yapabilirsiniz
        // Basitlik için, şimdilik sabit bir liste döndürüyoruz
        const busyTimes = await Appointment.find({
            date: new Date(date)
        }).select('time').lean();
        
        const allTimes = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
        const busyTimesList = busyTimes.map(item => item.time);
        const availableTimes = allTimes.filter(time => !busyTimesList.includes(time));
        
        res.json({
            success: true,
            availableTimes
        });
    } catch (error) {
        console.error('Müsait saatleri getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

module.exports = router;