const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

const userSchema = new mongoose.Schema({
  iin: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model('User', userSchema);

app.post('/api/auth/register', async (req, res) => {
  const { iin, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ iin });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this IIN already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ iin, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { iin, password } = req.body;

  try {
    // Find user by IIN
    const user = await User.findOne({ iin });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Generate JWT token
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const token = jwt.sign({ iin: user.iin }, secretKey, { expiresIn: '1h' });

    // Return token
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});