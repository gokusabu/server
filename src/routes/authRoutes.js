const express = require('express')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const UserModel = require('../models/userModel')
const verifyUser = require('../middleware/verifyUser')
const { default: mongoose } = require('mongoose')

const authRouter = express.Router()

authRouter.post('/register',async(req,res)=>{
    try{
        const{username,email,password} = req.body

        const user = await UserModel.findOne({email})

        if(user){
            return res.json({message:"User Already Exists!"})
        }
        const newPass = await bcrypt.hash(password,10)

        const newUser = new UserModel({username,email,password:newPass})
        await newUser.save()

        res.json({message:"Account Created Successfully!!"})
        }
    catch(err){
        res.json(err)
    }
    
})

authRouter.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await UserModel.findOne({ email });
  
      if (!user) {
        return res.json({ message: "User does not exist!" });
      }
  
      const verify = await bcrypt.compare(password, user.password);
  
      if (!verify) {
        return res.json({ message: "Incorrect Password" });
      }

      if(user.status === "banned"){
        return res.json({message:"This account has been banned from loggin in",userStatus:user.status})
      }
  
      const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
      res.json({ token, userID: user._id,message:`Welcome ${user.username}!!` });
    } catch (err) {
      res.json(err);
    }
  });

  authRouter.post('/:userID',async(req,res)=>{
    try{
        const{userID} = req.params.userID

        const user = await UserModel.findById(userID)

        if (!user) {
          return res.json({ message: "User does not exist!" });
        }

        res.json(user)
        }
    catch(err){
        res.json(err)
    }
    
})



module.exports = authRouter

