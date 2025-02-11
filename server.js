import express from 'express';
import mongoose from 'mongoose';
import User from "./Users.js";
import authenticate  from './Authmiddlware.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cors from 'cors';



const JWT_SECRET = "your_jwt_secret_key";

mongoose.connect("mongodb+srv://sharpinnovation10:MIv6Vz32Krh08Ab1@cluster0.gphjt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
const app = express();

app.use(cors());
app.use(express.json());  // Add this line to handle JSON body parsing

app.listen(5100, () => {
    console.log(`Server running at http://localhost:5100`);
});

db.on("open", () => {
    console.log("MongoDB connected successfully");
});

db.on("error", () => {
    console.log("MongoDB connection failed");
});

// Signup Route
app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user instance
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        // Save the user to the database
        await user.save();
        res.json({ message: "User Created Successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error occurred", error: err });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(400).json({ message: "Invalid username" });
        }

        // Compare the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ message: "Error occurred", error });
    }
});

// Protected Route - Get User Data
app.get("/user", authenticate, (req, res) => {
    User.find().then((users) => {
        res.json(users);
    }).catch((err) => {
        res.status(500).json({ message: "Error occurred", error: err });
    });
});
