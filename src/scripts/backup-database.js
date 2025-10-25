import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Tool } from '../db/models/Tool.ts';
import { connectDB } from '../db/connection.ts';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createBackup = async () => {
    try {
        console.log('🔄 Starting database backup...');
        
        // Connect to database
        await connectDB();
        console.log('✅ Database connected');
        
        // Get all tools
        const tools = await Tool.find({});
        console.log(`📊 Found ${tools.length} tools to backup`);
        
        // Create backup directory if it doesn't exist
        const backupDir = path.join(__dirname, '../../../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Create backup filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `tools-backup-${timestamp}.json`);
        
        // Write backup file
        fs.writeFileSync(backupFile, JSON.stringify(tools, null, 2));
        
        console.log(`✅ Backup created: ${backupFile}`);
        console.log(`📁 Backup size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`);
        
        // Also create a metadata file
        const metadataFile = path.join(backupDir, `backup-metadata-${timestamp}.json`);
        const metadata = {
            timestamp: new Date().toISOString(),
            toolCount: tools.length,
            backupFile: path.basename(backupFile),
            collections: {
                tools: tools.length
            }
        };
        
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
        console.log(`📋 Metadata saved: ${metadataFile}`);
        
    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    } finally {
        mongoose.disconnect();
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createBackup();
}

export { createBackup }; 