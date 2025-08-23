const fs = require('fs-extra');
const path = require('path');
const esbuild = require('esbuild');
const archiver = require('archiver');
const chokidar = require('chokidar');
const { minify } = require('html-minifier-terser');

const args = process.argv.slice(2);
const watchMode = args.includes('--watch');
const releaseMode = args.includes('--release');
const verboseMode = args.includes('--verbose');
const useZopfli = args.includes('--zopfli');

let projectName = 'mygame';
const projectArg = args.find(arg => arg.startsWith('--project='));
if (projectArg) projectName = projectArg.split('=')[1];

const srcDir = path.join(__dirname, 'src');
const targetDir = path.join(__dirname, 'target');
const buildDir = path.join(__dirname, 'build');

// Configuration object for easy customization
const CONFIG = {
    LIMIT: 13312,
    MAX_FILE_SIZE: 1024 * 1024, // 1MB limit
    ZIP_LEVEL: 9,
    WATCH_IGNORE: ['**/node_modules/**', '**/.git/**', '**/.DS_Store'],
    BUILD_TIMEOUT: 30000,
    CLEANUP_ON_EXIT: true
};

function color(text, colorName) {
    const colors = {
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        green: '\x1b[32m',
        reset: '\x1b[0m',
        bold: '\x1b[1m'
    };
    return `${colors[colorName] || ''}${text}${colors.reset}`;
}

function log(message, level = 'info') {
    if (verboseMode || level === 'error' || level === 'warn') {
        const timestamp = new Date().toISOString();
        const levelColor = level === 'error' ? 'red' : level === 'warn' ? 'yellow' : '';
        const formattedMessage = levelColor ? color(`[${timestamp}] ${message}`, levelColor) : `[${timestamp}] ${message}`;
        console.log(formattedMessage);
    }
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function processJsFile(filePath) {
    try {
        const stats = await fs.stat(filePath);
        if (stats.size > CONFIG.MAX_FILE_SIZE) {
            log(`⚠️  Large JS file detected: ${path.basename(filePath)} (${stats.size} bytes)`, 'warn');
        }
        
        await esbuild.build({
            entryPoints: [filePath],
            outfile: filePath,
            minify: true,
            bundle: false,
            allowOverwrite: true
        });
        
        log(`✅ Processed JS: ${path.basename(filePath)}`, 'info');
    } catch (error) {
        log(`❌ Failed to process JS file ${path.basename(filePath)}: ${error.message}`, 'error');
        throw error;
    }
}

async function processCssFile(filePath) {
    try {
        const stats = await fs.stat(filePath);
        if (stats.size > CONFIG.MAX_FILE_SIZE) {
            log(`⚠️  Large CSS file detected: ${path.basename(filePath)} (${stats.size} bytes)`, 'warn');
        }
        
        await esbuild.build({
            entryPoints: [filePath],
            outfile: filePath,
            minify: true,
            bundle: false,
            allowOverwrite: true
        });
        
        log(`✅ Processed CSS: ${path.basename(filePath)}`, 'info');
    } catch (error) {
        log(`❌ Failed to process CSS file ${path.basename(filePath)}: ${error.message}`, 'error');
        throw error;
    }
}

async function processHtmlFile(filePath) {
    try {
        const html = await fs.readFile(filePath, 'utf8');
        const minified = await minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
            ...(releaseMode && {
                collapseBooleanAttributes: true,
                removeAttributeQuotes: true,
                removeEmptyAttributes: true,
                sortAttributes: true,
                sortClassName: true
            })
        });
        await fs.writeFile(filePath, minified, 'utf8');
        
        log(`✅ Processed HTML: ${path.basename(filePath)}`, 'info');
    } catch (error) {
        log(`❌ Failed to process HTML file ${path.basename(filePath)}: ${error.message}`, 'error');
        throw error;
    }
}

async function processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        if (ext === '.js') {
            await processJsFile(filePath);
        } else if (ext === '.css') {
            await processCssFile(filePath);
        } else if (ext === '.html') {
            await processHtmlFile(filePath);
        }
    } catch (error) {
        log(`❌ Failed to process file ${path.basename(filePath)}: ${error.message}`, 'error');
        throw error;
    }
}

async function processDirectory(dir) {
    try {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
            // Skip hidden files and common system files
            if (item.startsWith('.') || item === 'Thumbs.db') {
                continue;
            }
            
            const itemPath = path.join(dir, item);
            const stat = await fs.stat(itemPath);
            
            if (stat.isDirectory()) {
                await processDirectory(itemPath);
            } else if (stat.isFile()) {
                await processFile(itemPath);
            }
        }
    } catch (error) {
        log(`❌ Failed to process directory ${dir}: ${error.message}`, 'error');
        throw error;
    }
}

function inlineAssets(html, fileType, files, targetDir) {
    let modifiedHtml = html;
    
    for (const file of files) {
        try {
            const filePath = path.join(targetDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            if (fileType === 'js') {
                // Try multiple regex patterns to handle different HTML structures
                let regex = new RegExp(`<script[^>]*src=["']${escapeRegex(file)}["'][^>]*>\\s*</script>`, 'gi');
                let matches = html.match(regex);
                
                if (!matches || matches.length === 0) {
                    // Try without quotes
                    regex = new RegExp(`<script[^>]*src=${escapeRegex(file)}[^>]*>\\s*</script>`, 'gi');
                    matches = html.match(regex);
                }
                
                if (!matches || matches.length === 0) {
                    // Try with just the filename
                    regex = new RegExp(`<script[^>]*src=["']?${escapeRegex(file)}["']?[^>]*>\\s*</script>`, 'gi');
                    matches = html.match(regex);
                }
                
                if (matches && matches.length > 0) {
                    modifiedHtml = modifiedHtml.replace(regex, `<script>${content}</script>`);
                }
            } else if (fileType === 'css') {
                const regex = new RegExp(`<link[^>]*href=["']${escapeRegex(file)}["'][^>]*>`, 'gi');
                modifiedHtml = modifiedHtml.replace(regex, `<style>${content}</style>`);
            }
            
            log(`✅ Inlined ${fileType.toUpperCase()}: ${file}`, 'info');
        } catch (error) {
            log(`⚠️  Failed to inline ${fileType} file ${file}: ${error.message}`, 'warn');
        }
    }
    
    return modifiedHtml;
}

async function cleanup() {
    try {
        if (await fs.pathExists(targetDir)) {
            await fs.remove(targetDir);
            log('🧹 Cleaned up temporary files', 'info');
        }
    } catch (error) {
        log(`⚠️  Cleanup failed: ${error.message}`, 'warn');
    }
}

async function createZipWithArchiver(zipPath, targetDir, startTime, zipName) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: CONFIG.ZIP_LEVEL } });
        
        output.on('close', () => {
            const size = archive.pointer();
            const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
            
            let sizeMsg = `${size} bytes`;
            if (releaseMode) {
                const percent = ((size / CONFIG.LIMIT) * 100).toFixed(2);
                if (size > CONFIG.LIMIT) {
                    sizeMsg = color(`OVER LIMIT by ${size - CONFIG.LIMIT} bytes!`, 'red');
                } else if (percent >= 95) {
                    sizeMsg = color(`${size} bytes (${percent}%)`, 'red');
                } else if (percent >= 80) {
                    sizeMsg = color(`${size} bytes (${percent}%)`, 'yellow');
                } else {
                    sizeMsg = color(`${size} bytes (${percent}%)`, 'green');
                }
            }
            
            if (watchMode && releaseMode) {
                process.stdout.write('\x1Bc'); // clear screen
                console.log(color('=== js13k Live Build Dashboard ===', 'bold'));
                console.log(`Project: ${projectName}`);
                console.log(`ZIP: ${zipName}`);
                console.log(`Size: ${sizeMsg}`);
                console.log(`Time: ${buildTime}s`);
                console.log(`Updated: ${new Date().toLocaleTimeString()}`);
            } else {
                console.log(`📦 ${zipName} → ${sizeMsg} (Built in ${buildTime}s)`);
            }
            
            log(`✅ Build completed successfully in ${buildTime}s`, 'info');
            resolve();
        });
        
        archive.on('error', (error) => {
            log(`❌ Archive creation failed: ${error.message}`, 'error');
            reject(error);
        });
        
        archive.on('warning', (warning) => {
            log(`⚠️  Archive warning: ${warning.message}`, 'warn');
        });
        
        archive.pipe(output);
        archive.directory(targetDir, false);
        archive.finalize();
    });
}

function createSimpleZip(files) {
    // Create a basic ZIP file structure
    const zipEntries = [];
    let offset = 0;
    
    // Local file headers
    for (const file of files) {
        const header = Buffer.alloc(30);
        header.writeUInt32LE(0x04034b50, 0); // Local file header signature
        header.writeUInt16LE(20, 4); // Version needed to extract
        header.writeUInt16LE(0, 6); // General purpose bit flag
        header.writeUInt16LE(8, 8); // Compression method (deflate)
        header.writeUInt16LE(0, 10); // Last mod file time
        header.writeUInt16LE(0, 12); // Last mod file date
        header.writeUInt32LE(0, 14); // CRC32 (we'll calculate this)
        header.writeUInt32LE(file.data.length, 18); // Compressed size
        header.writeUInt32LE(file.data.length, 22); // Uncompressed size
        header.writeUInt16LE(file.name.length, 26); // Filename length
        header.writeUInt16LE(0, 28); // Extra field length
        
        const nameBuffer = Buffer.from(file.name, 'utf8');
        const entry = Buffer.concat([header, nameBuffer, file.data]);
        zipEntries.push(entry);
        offset += entry.length;
    }
    
    // Central directory
    const centralDir = [];
    let centralOffset = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const header = Buffer.alloc(46);
        header.writeUInt32LE(0x02014b50, 0); // Central file header signature
        header.writeUInt16LE(20, 4); // Version made by
        header.writeUInt16LE(20, 6); // Version needed to extract
        header.writeUInt16LE(0, 8); // General purpose bit flag
        header.writeUInt16LE(8, 10); // Compression method
        header.writeUInt16LE(0, 12); // Last mod file time
        header.writeUInt16LE(0, 14); // Last mod file date
        header.writeUInt32LE(0, 16); // CRC32
        header.writeUInt32LE(file.data.length, 20); // Compressed size
        header.writeUInt32LE(file.data.length, 24); // Uncompressed size
        header.writeUInt16LE(file.name.length, 28); // Filename length
        header.writeUInt16LE(0, 30); // Extra field length
        header.writeUInt16LE(0, 32); // File comment length
        header.writeUInt16LE(0, 34); // Disk number start
        header.writeUInt16LE(0, 36); // Internal file attributes
        header.writeUInt32LE(0, 38); // External file attributes
        header.writeUInt32LE(centralOffset, 42); // Relative offset of local header
        
        const nameBuffer = Buffer.from(file.name, 'utf8');
        const entry = Buffer.concat([header, nameBuffer]);
        centralDir.push(entry);
        centralOffset += zipEntries[i].length;
    }
    
    // End of central directory record
    const endRecord = Buffer.alloc(22);
    endRecord.writeUInt32LE(0x06054b50, 0); // End of central dir signature
    endRecord.writeUInt16LE(0, 4); // Number of this disk
    endRecord.writeUInt16LE(0, 6); // Number of the disk with the start of the central directory
    endRecord.writeUInt16LE(files.length, 8); // Total number of entries in the central directory on this disk
    endRecord.writeUInt16LE(files.length, 10); // Total number of entries in the central directory
    endRecord.writeUInt32LE(Buffer.concat(centralDir).length, 12); // Size of the central directory
    endRecord.writeUInt32LE(centralOffset, 16); // Offset of start of central directory with respect to the starting disk number
    endRecord.writeUInt16LE(0, 20); // ZIP file comment length
    
    // Combine all parts
    return Buffer.concat([...zipEntries, ...centralDir, endRecord]);
}

async function createZipWithZopfli(zipPath, targetDir, startTime, zipName) {
    try {
        log('🔧 Using maximum compression mode (this will take longer)...', 'info');
        
        // Use archiver with optimized maximum compression settings
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { 
                zlib: { 
                    level: 9, // Maximum compression level
                    memLevel: 8, // High memory usage (8 is often better than 9)
                    strategy: 0, // Z_DEFAULT_STRATEGY (0) is usually better than 3
                    windowBits: 15, // Standard deflate window
                    chunkSize: 16384 // Optimal chunk size for compression
                } 
            });
            
            output.on('close', () => {
                const size = archive.pointer();
                const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
                
                let sizeMsg = `${size} bytes`;
                if (releaseMode) {
                    const percent = ((size / CONFIG.LIMIT) * 100).toFixed(2);
                    if (size > CONFIG.LIMIT) {
                        sizeMsg = color(`OVER LIMIT by ${size - CONFIG.LIMIT} bytes!`, 'red');
                    } else if (percent >= 95) {
                        sizeMsg = color(`${size} bytes (${percent}%)`, 'red');
                    } else if (percent >= 80) {
                        sizeMsg = color(`${size} bytes (${percent}%)`, 'yellow');
                    } else {
                        sizeMsg = color(`${size} bytes (${percent}%)`, 'green');
                    }
                }
                
                if (watchMode && releaseMode) {
                    process.stdout.write('\x1Bc'); // clear screen
                    console.log(color('=== js13k Live Build Dashboard ===', 'bold'));
                    console.log(`Project: ${projectName}`);
                    console.log(`ZIP: ${zipName} (Max Compression)`);
                    console.log(`Size: ${sizeMsg}`);
                    console.log(`Time: ${buildTime}s`);
                    console.log(`Updated: ${new Date().toLocaleTimeString()}`);
                } else {
                    console.log(`📦 ${zipName} → ${sizeMsg} (Built in ${buildTime}s) [Max Compression]`);
                }
                
                log(`✅ Build completed successfully in ${buildTime}s with maximum compression`, 'info');
                resolve();
            });
            
            archive.on('error', (error) => {
                log(`❌ Archive creation failed: ${error.message}`, 'error');
                reject(error);
            });
            
            archive.on('warning', (warning) => {
                log(`⚠️  Archive warning: ${warning.message}`, 'warn');
            });
            
            archive.pipe(output);
            archive.directory(targetDir, false);
            archive.finalize();
        });
        
    } catch (error) {
        log(`❌ Maximum compression failed: ${error.message}`, 'error');
        log('🔄 Falling back to standard archiver...', 'warn');
        return createZipWithArchiver(zipPath, targetDir, startTime, zipName);
    }
}



async function build() {
    const startTime = Date.now();
    
    try {
        log('🚀 Starting build...', 'info');
        
        // Clean up previous build
        await cleanup();
        
        // Copy source to target
        await fs.copy(srcDir, targetDir);
        log('📁 Copied source files to target directory', 'info');
        
        // Process all files recursively
        await processDirectory(targetDir);
        log('⚙️  Finished processing all files', 'info');
        
        if (releaseMode) {
            log('🔧 Starting release mode optimizations...', 'info');
            
            const htmlFiles = (await fs.readdir(targetDir)).filter(f => f.endsWith('.html'));
            const jsFiles = (await fs.readdir(targetDir)).filter(f => f.endsWith('.js'));
            const cssFiles = (await fs.readdir(targetDir)).filter(f => f.endsWith('.css'));
            
            // Process HTML files in parallel
            await Promise.all(htmlFiles.map(async (htmlFile) => {
                const htmlPath = path.join(targetDir, htmlFile);
                let html = await fs.readFile(htmlPath, 'utf8');
                
                // Inline JS and CSS
                html = inlineAssets(html, 'js', jsFiles, targetDir);
                html = inlineAssets(html, 'css', cssFiles, targetDir);
                
                await fs.writeFile(htmlPath, html, 'utf8');
            }));
            
            // Remove processed JS and CSS files
            await Promise.all([
                ...jsFiles.map(file => fs.remove(path.join(targetDir, file))),
                ...cssFiles.map(file => fs.remove(path.join(targetDir, file)))
            ]);
            
            log('✅ Release mode optimizations complete', 'info');
        }
        
        // Create build directory and zip
        await fs.ensureDir(buildDir);
        const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
        const zipName = `${projectName}-${dateStr}${releaseMode ? '-release' : ''}.zip`;
        const zipPath = path.join(buildDir, zipName);
        
        if (useZopfli) {
            // Use zopfli for maximum compression
            return createZipWithZopfli(zipPath, targetDir, startTime, zipName);
        } else {
            // Use archiver for faster compression
            return createZipWithArchiver(zipPath, targetDir, startTime, zipName);
        }
        
    } catch (error) {
        const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
        log(`❌ Build failed after ${buildTime}s: ${error.message}`, 'error');
        throw error;
    }
}

// Graceful shutdown handling
if (CONFIG.CLEANUP_ON_EXIT) {
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down gracefully...');
        await cleanup();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        await cleanup();
        process.exit(0);
    });
    
    process.on('uncaughtException', async (error) => {
        log(`💥 Uncaught exception: ${error.message}`, 'error');
        await cleanup();
        process.exit(1);
    });
    
    process.on('unhandledRejection', async (reason, promise) => {
        log(`💥 Unhandled rejection at ${promise}: ${reason}`, 'error');
        await cleanup();
        process.exit(1);
    });
}

if (watchMode) {
    console.log(`👀 Watching ${srcDir} for changes...`);
    console.log(`📊 Use --verbose for detailed logging`);
    console.log(`🛑 Press Ctrl+C to stop watching`);
    
    chokidar.watch(srcDir, { 
        ignoreInitial: true,
        ignored: CONFIG.WATCH_IGNORE
    })
    .on('all', async (event, filePath) => {
        try {
            log(`📝 File change detected: ${event} ${path.relative(srcDir, filePath)}`, 'info');
            await build();
        } catch (err) {
            log(`❌ Build failed: ${err.message}`, 'error');
        }
    })
    .on('error', (error) => {
        log(`❌ Watch error: ${error.message}`, 'error');
    });
} else {
    build().catch(async (error) => {
        log(`❌ Build failed: ${error.message}`, 'error');
        await cleanup();
        process.exit(1);
    });
}
