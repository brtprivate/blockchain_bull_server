const mongoose = require('mongoose');
const User = require('./models/User');
const Referral = require('./models/Referral');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blockchainbull', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Create indexes for better performance
    await User.createIndexes();
    await Referral.createIndexes();
    
    console.log('Database indexes created successfully');
    
    // Create a default admin user if none exists
    const adminExists = await User.findOne({ address: '0xA841371376190547E54c8Fa72B0e684191E756c7' });
    if (!adminExists) {
      const adminUser = new User({
        address: '0xA841371376190547E54c8Fa72B0e684191E756c7',
        referrerAddress: '0x0000000000000000000000000000000000000000',
        isActive: true
      });
      
      await adminUser.save();
      console.log('Default admin user created');
    }
    
    console.log('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
});
