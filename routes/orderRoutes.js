const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const { auth } = require('../middleware/auth');

// Sipariş oluştur
router.post('/orders', auth, async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            address,
            items,
            totalAmount,
            paymentMethod
        } = req.body;

        const order = new Order({
            userId: req.userId,
            items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            totalAmount,
            shippingAddress: address,
            customerInfo: {
                fullName,
                email,
                phone
            },
            paymentMethod,
            status: 'pending'
        });

        await order.save();

        res.json({
            success: true,
            message: 'Sipariş başarıyla oluşturuldu',
            orderId: order._id
        });

    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sipariş oluşturulurken bir hata oluştu'
        });
    }
});

module.exports = router;