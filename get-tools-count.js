import 'dotenv/config';
import { connectDB } from './src/db/connection.ts';
import { Tool } from './src/db/models/Tool.ts';
import mongoose from 'mongoose';

async function getToolCount() {
  try {
    await connectDB();
    const publishedCount = await Tool.countDocuments({ status: 'published' });
    const totalCount = await Tool.countDocuments({});
    console.log('📊 Database Statistics:');
    console.log(`   Published tools: ${publishedCount.toLocaleString()}`);
    console.log(`   Total tools: ${totalCount.toLocaleString()}`);
    console.log(`\n🎯 Update frontend to show: ${publishedCount.toLocaleString()} AI Tools Available`);
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

getToolCount(); 