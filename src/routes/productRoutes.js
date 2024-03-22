const express = require('express')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const ProductModel = require('../models/productModel')
const verifyUser = require('../middleware/verifyUser')
const UserModel = require('../models/userModel')
const stripe = require('stripe')(process.env.STRIPE_KEY)

const productRouter = express()

productRouter.get('/',async(req,res)=>{
    try{
        const response = await ProductModel.find({})
        res.json(response)
    }
    catch(err){
        res.json(err)
    }
})

productRouter.post('/',async(req,res)=>{
    const product = new ProductModel(req.body)
    try{
        const response = await product.save()
        res.json(response)
    }
    catch(err){
        res.json(err)
    }
})

// adding a product to wishlist
productRouter.put('/',verifyUser,async(req,res)=>{
    
    try{
        const product = await ProductModel.findById(req.body.productID)
        const user = await UserModel.findById(req.body.userID)

        user.wishlist.push(product)
        await user.save()
        res.json({wishlist:user.wishlist,message:"Added to Wishlist.."})
    }
    catch(err){
        res.json(err)
    }
})

// products which the logged user has been saved
productRouter.get('/wishlist/ids/:userID',async(req,res)=>{
    try{
        const user = await UserModel.findById(req.params.userID)
        res.json({wishlist:user?.wishlist})

    }
    catch(err){
        res.json(err)
    }
})

//to get all the products in the wishlist
productRouter.get('/wishlist/:userID',async(req,res)=>{
    try{
        const user = await UserModel.findById(req.params.userID)
        const wishlist = await ProductModel.find({
            _id:{$in :user.wishlist}
        })
        res.json({wishlist})

    }
    catch(err){
        res.json(err)
    }
})

//removing a product from the wishlist
productRouter.delete('/:productID/:userID', async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.productID);
      const user = await UserModel.findById(req.params.userID);
  
      // Remove the product from the wishlist array
      user.wishlist = user.wishlist.filter((wishlistProduct) => wishlistProduct.toString() !== product._id.toString());
  
      await user.save();
      res.json({ wishlist: user.wishlist,message:"Removed from Wishlist" });
    } catch (err) {
      res.json(err);
    }
  });

productRouter.get('/:productID',async(req,res)=>{
    try{
        const product = await ProductModel.findById(req.params.productID)
        res.json(product)
    }
    catch(err)
    {
        res.json(err)

    }
})


// adding a product to cart
productRouter.put('/cart', async (req, res) => {
    try {
        const { productID, size, quantity } = req.body;

        // Check if productID is provided
        if (!productID) {
            return res.status(400).json({ error: 'Product ID is required.' });
        }

        const product = await ProductModel.findById(productID);

        // Check if the product exists
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const user = await UserModel.findById(req.body.userID);

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check if the product already exists in the user's cart
        const existingCartItemIndex = user.cart.findIndex(item => 
            item.product._id.toString() === productID && item.size === size
        );

        if (existingCartItemIndex !== -1) {
            // If the product already exists, increment the quantity
            user.cart[existingCartItemIndex].quantity += quantity || 1;
        } else {
            // If the product doesn't exist, add it to the cart
            user.cart.push({ product: product, size: size || 'M', quantity: quantity || 1 });
        }

        await user.save();
        res.json({ cart: user.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Changing the quantities of an item in cart
// productRouter.put('/cart/:userID', async (req, res) => {
//     try {
//       const { cart } = req.body;
//       const userID = req.params.userID;
  
//       // Update the user's cart in the database based on the provided cart data
//       await UserModel.findByIdAndUpdate(userID, { $set: { cart: cart } });
  
//       res.json({ success: true });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   });

  // Remove item from cart
// productRouter.put('/cart/:productID', async (req, res) => {
//     try {
//       const { userID, action } = req.body;
  
//       const user = await UserModel.findById(userID);
  
//       if (!user) {
//         return res.status(404).json({ error: 'User not found.' });
//       }
  
//       const productID = req.params.productID;
  
//       // Check if the action is 'remove'
//       if (action === 'remove') {
//         // Remove the item from the user's cart based on the product ID
//         user.cart = user.cart.filter(item => item.product.toString() !== productID);
//       }
  
//       await user.save();
//       res.json({ cart: user.cart });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   });



// products which the logged user has been added to cart
productRouter.get('/cart/ids/:userID', async (req, res) => {
    try {
        // Assuming you have user authentication and the user ID is available in the request
        const userID = req.params.userID; // Adjust this based on your authentication setup

        const user = await UserModel.findById(userID).populate('cart.product');

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const cartItems = user.cart.map(cartItem => ({
            _id: cartItem.product._id,
            name: cartItem.product.name,
            brand: cartItem.product.brand,
            rating: cartItem.product.rating,
            img: cartItem.product.img,
            desc: cartItem.product.desc,
            price: cartItem.product.price,
            size: cartItem.size,
            quantity: cartItem.quantity
        }));

        res.json(cartItems);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
productRouter.get('/cart/:userID', async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.userID).populate('cart.product');

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const cart = user.cart.map(cartItem => ({
            _id: cartItem.product._id,  // Add product _id for uniqueness
            name: cartItem.product.name,
            brand: cartItem.product.brand,
            rating: cartItem.product.rating,
            img: cartItem.product.img,
            desc: cartItem.product.desc,
            price: cartItem.product.price,
            size: cartItem.size,
            quantity: cartItem.quantity
        }));

        res.json(cart);  // Send cart as an array directly
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//updating quantity cart
productRouter.put('/cart/:userID', async (req, res) => {
    try {
      const userID = req.params.userID;
      const { cart } = req.body;
  
      const user = await UserModel.findById(userID);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      // Update quantities in the user's cart
      user.cart = cart.map((cartItem) => ({
        product: cartItem.product,
        size: cartItem.size,
        quantity: cartItem.quantity || 1,
      }));
  
      await user.save();
  
      res.json({ cart: user.cart });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

//deleting an item from cart
productRouter.delete('/cart/:userID/:productID/:size', async (req, res) => {
    try {
        const { userID, productID, size } = req.params;

        const user = await UserModel.findById(userID);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Find the index of the cart item with the specified product ID and size
        const cartItemIndex = user.cart.findIndex(cartItem => cartItem.product.equals(productID) && cartItem.size === size);

        // Remove the item from the cart array
        if (cartItemIndex !== -1) {
            user.cart.splice(cartItemIndex, 1);
            await user.save();
            res.json({ message: 'Product removed from cart successfully.' });
        } else {
            res.status(404).json({ error: 'Product not found in the cart.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//deleting all items from the cart array
productRouter.delete('/cart/empty/:userID', async (req, res) => {
    try {
        const userID = req.params.userID;

        const user = await UserModel.findById(userID);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Set the cart array to an empty array
        user.cart = [];
        await user.save();

        res.json({ message: 'Cart emptied successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//adding product to cart(active)
productRouter.put('/cart', async (req, res) => {
  try {
    const { userID, productID, size } = req.body;

    // Check if the product with the same size is already in the cart
    const existingCartItem = await UserSchema.findOneAndUpdate(
      {
        _id: userID,
        'cart.product': productID,
        'cart.size': size,
      },
      {
        $inc: { 'cart.$.quantity': 1 }, // Increment quantity if found
      },
      { new: true }
    );

    if (!existingCartItem) {
      // If the product with the same size is not found, add a new item to the cart
      const user = await UserSchema.findByIdAndUpdate(
        userID,
        {
          $push: {
            cart: {
              product: productID,
              size: size,
              quantity: 1,
            },
          },
        },
        { new: true }
      ).select('cart');

      return res.json({ cart: user.cart });
    }

    // If the product with the same size is found, return the updated cart
    const updatedUser = await UserSchema.findById(userID).select('cart');
    res.json({ cart: updatedUser.cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Increment quantity in cart
productRouter.put('/cart/increment/:userID/:productID/:size', async (req, res) => {
    try {
        const { userID, productID, size } = req.params;

        // Find the user by ID
        const user = await UserModel.findById(userID);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Find the index of the cart item by product ID and size
        const cartItemIndex = user.cart.findIndex(item => item.product.toString() === productID && item.size === size);

        if (cartItemIndex === -1) {
            return res.status(404).json({ error: 'Product not found in cart.' });
        }

        // Increment quantity
        user.cart[cartItemIndex].quantity += 1;

        // Save the updated user object
        await user.save();

        // Respond with the updated cart
        res.json({ cart: user.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Decrement quantity in cart
productRouter.put('/cart/decrement/:userID/:productID/:size', async (req, res) => {
    try {
        const { userID, productID, size } = req.params;

        // Find the user by ID
        const user = await UserModel.findById(userID);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Find the index of the cart item by product ID and size
        const cartItemIndex = user.cart.findIndex(item => item.product.toString() === productID && item.size === size);

        if (cartItemIndex === -1) {
            return res.status(404).json({ error: 'Product not found in cart.' });
        }

        // Ensure quantity doesn't go below 1
        if (user.cart[cartItemIndex].quantity > 1) {
            // Decrement quantity
            user.cart[cartItemIndex].quantity -= 1;
        }

        // Save the updated user object
        await user.save();

        // Respond with the updated cart
        res.json({ cart: user.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// productRouter.get('/search/:key',async(req,res)=>{
//     try{
//         const {key} = req.params
//         const product = await ProductModel.findOne(key)
//     }
    

// })



//search
productRouter.get('/search/:searchKey', async (req, res) => {
    try {
        const searchKey = req.params.searchKey;
        let product;

        if (searchKey.length === 1) {
            product = await ProductModel.find({ name: { $regex: new RegExp('^' + searchKey, 'i') } });
        } else {
            product = await ProductModel.find({
                $or: [
                    { name: { $regex: new RegExp(searchKey, 'i') } },
                    { brand: { $regex: new RegExp(searchKey, 'i') } }
                ]
            });
        }

        if (product.length > 0) {
            res.status(200).json({match:true, message: "Search complete", product: product });
        } else {
            res.json({match:false, message: "Product not found" });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


//get products of a specific brand
productRouter.get('/brand/:brandName', async (req, res) => {
    try {
        const { brandName } = req.params;
        // Perform a case-insensitive search for products whose brand name matches the provided brandName
        const products = await ProductModel.find({ brand: { $regex: new RegExp('^' + brandName, 'i') } });
        
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});



module.exports = productRouter