const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountPrice: {
        type: Number,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['hearing-aids', 'ear-molds', 'accessories', 'batteries']
    },
    imageUrl: {
        type: String,
        required: true
    },
    imageGallery: [String],
    stock: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    specifications: [{
        name: String,
        value: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Güncelleme öncesi updatedAt alanını güncelleme
productSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: new Date() });
    next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;