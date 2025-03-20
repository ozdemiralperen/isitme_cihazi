const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    emailProvider: {
        type: String,
        default: 'Diğer'
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    phone: String,
    address: String,
    suspendedAt: {
        type: Date,
        default: null
    },
    suspendedReason: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Kullanıcı giriş yapmadan önce durumunu kontrol et
UserSchema.pre('save', function(next) {
    if (this.status === 'inactive') {
        const error = new Error('Bu hesap askıya alınmıştır. Lütfen yönetici ile iletişime geçin.');
        error.name = 'SuspendedAccountError';
        return next(error);
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);