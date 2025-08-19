const fs = require('fs');
const path = require('path');

// Define paths
const targetDir = path.join(__dirname, 'target');
const httpdocsDir = path.join(__dirname, '..', 'httpdocs');

console.log('🚀 Launching game to httpdocs...');

// Check if target directory exists
if (!fs.existsSync(targetDir)) {
    console.error('❌ Target directory not found!');
    process.exit(1);
}

// Check if httpdocs directory exists, create if it doesn't
if (!fs.existsSync(httpdocsDir)) {
    console.log('📁 Creating httpdocs directory...');
    fs.mkdirSync(httpdocsDir, { recursive: true });
}

// Delete existing index.html and script.js from httpdocs
const filesToDelete = ['index.html', 'script.js'];
filesToDelete.forEach(file => {
    const filePath = path.join(httpdocsDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`🗑️  Deleting existing ${file}...`);
        fs.unlinkSync(filePath);
    }
});

// Copy all files from target to httpdocs
console.log('📋 Copying files from target to httpdocs...');
const targetFiles = fs.readdirSync(targetDir);

targetFiles.forEach(file => {
    if (file !== '.gitkeep') { // Skip .gitkeep file
        const sourcePath = path.join(targetDir, file);
        const destPath = path.join(httpdocsDir, file);
        
        if (fs.statSync(sourcePath).isFile()) {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`✅ Copied ${file}`);
        }
    }
});

console.log('🎉 Game launched successfully to httpdocs!');
console.log(`📂 Files copied to: ${httpdocsDir}`);
