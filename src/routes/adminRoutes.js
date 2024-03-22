const express = require('express')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const AdminModel = require('../models/adminModel')
const UserModel = require('../models/userModel')
const ProductModel = require('../models/productModel')
const verifyAdmin = require('../middleware/verifyAdmin')

const adminRouter = express.Router()


//admin register
adminRouter.post('/register',async(req,res)=>{
    try{
        const {username,email,password} = req.body
        const admin = await AdminModel.findOne({email})

        if(admin){
            return res.json({message:"Email already registered,try another email"})
        }

        const newPass = await bcrypt.hash(password,10)

        const newAdmin = new AdminModel({username,email,password:newPass})
        await newAdmin.save()
        res.json({message:"account created successfully",admin:newAdmin})
    }
    catch(err){
        res.json(err)
    }
})

//admin login
adminRouter.post('/login',async(req,res)=>{
    try{
        const {email,password} = req.body
        const admin = await AdminModel.findOne({email})
    
        if(!admin)
        {
            return res.json({message:"invaid Email"})
        }
    
        const verify = bcrypt.compare(admin.password,password)
    
        if(!verify){
            return res.json({message:"incorrect password"})
        }
    
        const adminToken = jwt.sign({ id :admin._id},process.env.SECRET_KEY)
        res.json({ adminToken , adminID:admin._id })
    }
    catch(err){
        res.json(err)
    }
   
})

//getting all users
adminRouter.get('/user-list',verifyAdmin,async(req,res)=>{
    try{
        const users = await UserModel.find()
        res.json(users)
    }
    catch(err){
        res.json(err)
    }
})

//ban users
adminRouter.put('/:userID',async(req,res)=>{
    try{
        const userID = req.params.userID
        const user = await UserModel.findById(userID)

        user.status = user.status === "banned" ? "active" : "banned";
        await user.save()
        let message;
        if (user.status === "banned") {
            message = `User ${user.username} has been Banned!`;
        } else {
            message = `User ${user.username} has been UnBanned!`;
        }
        res.json({message:message,user:user})
    }
    catch(err){
        res.json(err)
    }
})

//get all products
adminRouter.get('/product-list',verifyAdmin,async(req,res)=>{
    try{
        const response = await ProductModel.find({})
        res.json(response)
    }
    catch(err){
        res.json(err)
    }
})

//edit product info
adminRouter.put('/product/:productID',async(req,res)=>{
    try{
        const {name,brand,price,rating,desc,img,img2,img3} = req.body
        const productID = req.params.productID;

        const product = await ProductModel.findById(productID);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.name = name
        product.brand = brand
        product.price = price
        product.rating = rating
        product.desc = desc
        product.img = img
        product.img2 = img2
        product.img3 = img3

        await product.save()
        res.json({message:"product updated",product:product})
    }
    catch(err)
    {
        res.json(err)
    }
})


//add new product
adminRouter.post('/product',verifyAdmin,async(req,res)=>{
    try{
        // const {name,brand,price,rating,desc,img,img2,img3} = req.body

        const product = new ProductModel(req.body)

        await product.save()
        res.json({message:"product added",product:product})
    }
    catch(err)
    {
        res.json(err)
    }
})

//delete product
adminRouter.delete('/:productID',async(req,res)=>{
    try{
        const productID = req.params.productID

        const product = await ProductModel.findByIdAndDelete(productID)

        res.json({message:"product deleted",product:product})
    }
    catch(err)
    {
        res.json(err)
    }
})





module.exports = adminRouter




