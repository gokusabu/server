const express = require('express')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const verifyUser = (req,res,next) =>{
    const token =req.headers.authorization
    if(token)
    {
        jwt.verify(token,process.env.SECRET_KEY,(err)=>{
            if(err) return  res.sendStatus(403).json({message:'access forbidden'})
            next()
        })
    }
    else{
        res.sendStatus(401).json({message:'unauthorized user'})

    }
}

module.exports = verifyUser