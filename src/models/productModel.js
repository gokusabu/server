const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    name:{type:String,required:true},
    brand:{type:String,required:true},
    rating:{type:Number},
    img:{type:String,required:true},
    img2:{type:String},
    img3:{type:String},
    desc:{type:String},
    price:{type:Number,required:true}
},{ timestamps: true })

 const ProductModel = mongoose.model("products",ProductSchema)

 module.exports =ProductModel