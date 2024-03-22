require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
// const userRouter = require('./routes/authRoutes')
const productRouter = require('./routes/productRoutes')
const authRouter = require('./routes/authRoutes')
const userRouter = require('./routes/userRoutes')
const adminRouter = require('./routes/adminRoutes')
const checkoutRouter = require('./routes/checkoutRoutes')
const reviewRouter = require('./routes/reviewRoutes')

const app = express()

app.use(express.json())
app.use(cors())

app.use('/auth',authRouter)
app.use('/products',productRouter)
app.use('/user',userRouter)
app.use('/admin',adminRouter)
app.use('/checkout',checkoutRouter)
app.use('/review',reviewRouter)

mongoose.connect(process.env.DATABASE_URL)

app.listen(process.env.PORT,()=>{console.log('server running!!')})