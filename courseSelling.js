const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());

app.use(express.json());

const SECRET = 'Doremon'

// Define Mongoose Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    purchasedCourse: [{type: mongoose.Schema.Types.ObjectId, ref: 'Course'}]
});

const adminSchema = new mongoose.Schema({
    username: String,
    password: String
});

const courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    imagelink: String,
    published: Boolean
});

// Mongoose MOdel Defination
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);

// Connect to MongoDb
mongoose.connect('mongodb+srv://souraabh:shaktiman@cluster1.j6ngpfi.mongodb.net/course',{useNewUrlParser: true, useUnifiedTopology: true, dbName: "course"});


const authenticateJwt = (req, res, next) =>{
    const authHeader = req.headers.authorization;
    if(authHeader){
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET, (err, user) =>{
            if(err){
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    }
    else{
        console.log("in 401");
        res.sendStatus(401);
    }
};

// Me Route
app.get("/admin/me", authenticateJwt, (req, res) => {
    res.json({
        username: req.user.username
    })
} );

// Admin Routes

app.post('/admin/signup', async (req, res) => {
    const {username, password} = req.body;
    const admin = await Admin.findOne({username});
    if(admin){
        res.status(403).json({message: "Admin already exists"})
    }
    else{
        const newAdmin = new Admin({username,password});
        await newAdmin.save();
        const token = jwt.sign({username, role: 'admin'}, SECRET, {'expiresIn': '1h'});
        res.json({message: "Admin Created Successfully", token});
    }
});

app.post('/admin/login', async (req, res) =>{
    const {username, password} = req.body;``
    const admin = await Admin.findOne({username, password});
    if(admin){
        const token = jwt.sign({username, role: 'admin'}, SECRET, {'expiresIn': '1h'});
        res.json({message: "Logged In Successfully", token});
    }
    else{
        res.status(403).json("Invalid Credentials");
    }
});

app.post('/admin/addcourse', async (req, res) => {
    const course = new Course(req.body);
    console.log(course);
    await course.save();
    res.json({message: "Course Created Successfully", courseId: course.id});
});

app.put('/admin/courses/:courseId', authenticateJwt, async (req, res) => {

        const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {new : true});

        if (course) {
            res.json({ message: 'Course Updated Successfully' });
        } else {
            res.status(403).json({ message: 'Not Found' });
        }
});

app.get('/admin/courses', authenticateJwt, async (req,res) => {
    const course = await Course.find({});
    res.json({ course });
})

app.get('/admin/course/:courseId', authenticateJwt, async (req, res) => {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId);
    res.json({course});
});

// User Route 

app.post('/user/signup', authenticateJwt, async (req,res) => {
    const {username, password} = req.body;
    const user = await User.findOne({username, password});
    if(user){
        res.status(403).json({message: "User already exists"})
    }
    else{
        const newUser = new User({username, password});
        await newUser.save();
        const token = jwt.sign({username, role: 'user'}, SECRET, {'expiresIn': '1h'});
        res.json({message: "User Created Successfully", token});
    }
});

app.post('/user/login', async (req, res) =>{
    const {username, password} = req.body;
    const user = await User.findOne({username, password});
    if(user){
        const token = jwt.sign({username, role: 'user'}, SECRET, {'expiresIn': '1h'});
        res.json({message: "Logged In Successfully", token});
    }
    else{
        res.status(403).json("Invalid Credentials");
    }
});

app.get('/user/courses', authenticateJwt, async (req,res) => {
    const course = await Course.find({});
    res.json({course});
});

app.post('/user/courses/:courseId', authenticateJwt, async (req,res) =>{
    const course = await Course.findById(req.params.courseId);  
    if(course){
        const user = await Course.findOne({username: req.user.username});
        if(user) {
            user.purchasedCourse.push(course);
            await user.save();
            res.json({ message : " Course Purchased Successfully "});
        }
        else{
            res.status(403).json({message: "User not found "});
        }
    }
    else{
        res.status(404).json({message: "Course not found "});
    }
});

app.get('/user/purchasedCourse', authenticateJwt, async (req,res) => {
    const user = await User.findOne({ username: req.user.username }).populate('purchasedCourse');
    // const user = await User.findOne({username: req.user.username}).populate('purchasedCourse');
    if(user){
        res.json({purchasedCourse: user.purchasedCourse || []});
    }
    else{
        res.status(403).json({message: "user not found"});
    }
});

app.listen(3000, ()=> console.log("Server Running on Port 3000 "));


