require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const deleteUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Delete badshahjan582@gmail.com
    await User.deleteOne({ email: 'badshahjan582@gmail.com' });
    console.log('✅ Deleted badshahjan582@gmail.com');

    // Delete muhmmadjameelmj0786@gmail.com
    await User.deleteOne({ email: 'muhmmadjameelmj0786@gmail.com' });
    console.log('✅ Deleted muhmmadjameelmj0786@gmail.com');

    // Delete test@example.com
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Deleted test@example.com');

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

deleteUser();
