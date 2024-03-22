const express = require('express')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const UserModel = require('../models/userModel')
const verifyUser = require('../middleware/verifyUser')
const { default: mongoose } = require('mongoose')

const userRouter = express.Router()

userRouter.get('/:userID',async(req,res)=>{
    try{
        const{userID} = req.params

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



module.exports = userRouter