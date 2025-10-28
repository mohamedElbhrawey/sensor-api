const express = require('express')
const httpstatusTent=require('../utalis/httpStatusText');
const user= require('../models/customerSchema')
const asyncWrapper=require('../middelware/asyncWrapper');
const bcrypt= require('bcryptjs');



const getALLUsers = asyncWrapper(async(req, res) =>{
    const query= req.query;
    const limit =query.limit||10;
    const page= query.page ||1;
    const skip =(page-1) * limit;
     //get all users from monngo db
     const users = await user.find({},{"__v":false, "password": false}) .limit(limit).skip(skip)
     res.json({status: httpstatusTent.SUCCESS,data: {users}})})



const register = asyncWrapper(async (req, res) => {
    const { email, password ,phoneNumbers} = req.body;
    
    const olduser = await user.findOne({ email });
    if (olduser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    //password hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newuser = new user({ email, password: hashedPassword, phoneNumbers });
    await newuser.save();
    res.status(201).json({ status: httpstatusTent.SUCCESS, data: { user: newuser } });
});


const login = asyncWrapper(async (req, res) => {
    const { email, password } = req.body;
    if (!email && !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await user.findOne({ email:email });
    const matchedPassword = await bcrypt.compare(password, user.password);
    if (user && matchedPassword) {
        const token = user.generateAuthToken();
        return res.status(httpstatusTent.OK).json({ status: httpstatusTent.SUCCESS, data: { token } });
    }
    return res.status(httpstatusTent.UNAUTHORIZED).json({ message: 'Invalid email or password' });
});

module.exports={
    getALLUsers,
    register,
    login
}