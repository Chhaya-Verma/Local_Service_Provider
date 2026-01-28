import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

// Create admin user script
const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localservice');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ userType: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@localservice.com',
      password: 'admin123',
      phone: '+1234567890',
      userType: 'admin',
      isVerified: true,
    };
    
    const admin = new User(adminData);
    await admin.save();
    
    console.log('Admin user created successfully');
    console.log('Email: admin@localservice.com');
    console.log('Password: admin123');
    console.log('Please change the default password after first login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
