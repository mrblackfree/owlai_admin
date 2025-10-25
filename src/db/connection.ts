import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hunt';

export async function connectDB() {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB: Already connected');
            return;
        }
        console.log('MongoDB: Connecting to', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB: Connected successfully');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        throw error;
    }
} 