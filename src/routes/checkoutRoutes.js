const express = require('express')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const ProductModel = require('../models/productModel')
const verifyUser = require('../middleware/verifyUser')
const UserModel = require('../models/userModel')
const stripe = require('stripe')(process.env.STRIPE_KEY)

const checkoutRouter = express()

// //payment

// checkoutRouter.post('/',async(req,res)=>{
//     const {products} = req.body

//     const line_items = products.map((product)=>({
//         price_data:{
//             currency:"usd",
//             product_data:{
//                 name:product.name,
//                 description:product.desc
//             },
//             unit_amount: product.price * 100 
//         },
//         quantity:product.quantity,
//     }))

//     const session = await stripe.checkout.sessions.create({
//         payment_method_types :["card"],
//         line_items:line_items,
//         mode:"payment",
//         success_url:"http://localhost:3000/success",
//         cancel_url:"http://localhost:3000/cancel"

//     })
//     res.json({id:session.id})
// })

//adding products to order history(new)
// checkoutRouter.put('/:userID', async (req, res) => {
//     try {
//         const { productID } = req.body;

//         // Check if productID is provided
//         if (!productID) {
//             return res.status(400).json({ error: 'Product ID is required.' });
//         }

//         const product = await ProductModel.findById(productID);

//         // Check if the product exists
//         if (!product) {
//             return res.status(404).json({ error: 'Product not found.' });
//         }

//         const user = await UserModel.findById(req.params.userID);

//         // Check if the user exists
//         if (!user) {
//             return res.status(404).json({ error: 'User not found.' });
//         }

//         // Add the product to the orders array with timestamp
//         user.orders.push({ order: product, timestamp: new Date() });

//         await user.save();
//         res.json({ orders: user.orders });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


//buy the products in the cart and adding to order history
checkoutRouter.post('/', async (req, res) => {
    try {
        const { products, userID } = req.body;

        const line_items = products.map((product) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: product.name,
                    description: product.desc
                },
                unit_amount: Math.round(product.price * 100 / 82.89) // Convert USD to INR
            },
            quantity: product.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_items,
            mode: "payment",
            success_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cancel"
        });

        // adding products to order history
        if (session) {
            const user = await UserModel.findById(userID);

            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }

            // Add products to the user's order history
            for (const product of products) {
                const productToAdd = await ProductModel.findById(product._id);
                if (!productToAdd) {
                    return res.status(404).json({ error: `Product with ID ${product._id} not found.` });
                }
                user.orders.push({ order: productToAdd, timestamp: new Date() }); // Add timestamp
            }

            await user.save();
        }

        res.json({ id: session.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//buy a single product and adding to order history
checkoutRouter.post("/api/create-checkout-session", async (req, res) => { 
    
    try {
        const { product, userID } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: product.name,
                            description: product.desc
                        },
                        unit_amount: Math.round(product.price * 100 / 82.89) // Convert USD to INR
                    },
                    quantity: 1,
                }
            ],
            mode: "payment",
            success_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cancel"
        });

        // adding product to order history
        if (session) {
            const user = await UserModel.findById(userID);

            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }

            const productToAdd = await ProductModel.findById(product._id);
            if (!productToAdd) {
                return res.status(404).json({ error: `Product with ID ${product._id} not found.` });
            }

            user.orders.push({ order: productToAdd, timestamp: new Date() }); // Add timestamp

            await user.save();
        }

        res.json({ id: session.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





//getting the product history
checkoutRouter.get('/:userID', async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.userID);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Extracting product IDs from user's orders
        const orderIds = user.orders.map(order => order.order);

        // Fetching products using the extracted product IDs
        const orders = await ProductModel.find({
            _id: { $in: orderIds }
        });

        // Creating a new array to include timestamps along with products
        const ordersWithTimestamp = user.orders.map(order => {
            const product = orders.find(prod => prod._id.equals(order.order));
            return { product, timestamp: order.timestamp };
        });

        // Reversing the orders array if needed
        ordersWithTimestamp.reverse();

        res.json({ orders: ordersWithTimestamp });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//deletinbg product from order history
checkoutRouter.delete('/:userID/:productID', async (req, res) => {
    try {
        const productID = req.params.productID;
        const userID = req.params.userID;

        const product = await ProductModel.findById(productID);
        const user = await UserModel.findById(userID);

        // Find the index of the order containing the specified product ID
        const orderIndex = user.orders.findIndex(order => order.order.equals(productID));

        // If the order containing the product is found, remove it from the orders array
        if (orderIndex !== -1) {
            user.orders.splice(orderIndex, 1);
        }

        // Save the updated user object
        await user.save();

        res.json({ message: 'Product deleted from order history successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = checkoutRouter