const mongoose = require('mongoose')

const ReviewSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    comment: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    timestamp: { type: Date, default: Date.now }
})

const reviewModel = mongoose.model('reviews',ReviewSchema)

module.exports = reviewModel