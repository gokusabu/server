const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    status:{type:String,default:"active"},
    wishlist:[{type:mongoose.Schema.Types.ObjectId, ref:'products'}],
    cart: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
        size: { type: String, default: 'M' },
        quantity: { type: Number, default: 1,min:1 }
    }],
    orders: [{
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
        timestamp: { type: Date, default: Date.now }
    }]
})

 const UserModel = mongoose.model("users",UserSchema)

 module.exports =UserModel