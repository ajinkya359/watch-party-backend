const express = require('express');
const router = express.Router();
const User = require('../models/User')
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken')

const dotenv = require("dotenv");
dotenv.config();

const Jwt_sec = process.env.JWT_SECRET

//REGISTER : 

router.post('/register', [
    body('username', 'Enter a valid username').isLength({min : 3}),
    body('email', 'Enter a valid email').isEmail(),    
    body('password', 'Password must contain atleast 5 characters').isLength({min: 5})
],
  async(req,res)=> {
      const errors = validationResult(req);
      if(!errors.isEmpty()){
          return res.status(400).json({errors : errors.array()})
      }
      
      const{username, email, password} = req.body;
      try{
          let user_byemail = await User.findOne({ email: email });
          let user_byusername = await User.findOne({ username: username });
          if(user_byemail || user_byusername){
              return res.status(400).json({error : "Sorry, user already exists!"})
          }
          const salt = await bcrypt.genSalt(10);
          const secPass = await bcrypt.hash(password, salt);
          const user = await User.create({
              username: username,
              email : email,
              password: secPass
          })
          
       
       const data = {
           user:{
               id: user._id
           }
       }   
      
       const authToken = jwt.sign(data, Jwt_sec, {expiresIn:"3d"});
       res.status(201).json({authToken: authToken});

      }catch(err){
          res.status(400).json({err});
      }
 })



router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must contain atleast 5 characters').isLength({min: 5})
], 
async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.json({errors: errors})
    }
    const {email, password} = req.body;
    
    try{
        let user = await User.findOne({email : email})
        if(!user){
          return res.json({error : "User does not exists"})
        }
        
        const passwordCompare = await bcrypt.compare(password, user.password)
         console.log(passwordCompare)
        if (!passwordCompare) {                              
            return res.status(400).json({error : "Wrong Credentials" });
       }
        
       const data = {
            user: {
                 id: user.id
            }
       }
       const authToken = jwt.sign(data, Jwt_sec);  
       res.status(200).json({authToken : authToken});
    }catch(err){
        res.status(400).json({err});
    }
    
}
)

 module.exports = router