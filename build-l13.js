const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const verboseMode = args.includes('--verbose');
const releaseMode = args.includes('--release');

// Configuration
const srcDir = path.join(__dirname, 'src');
const tempDir = path.join(__dirname, 'temp-l13');
const distDir = path.join(__dirname, 'dist');

function log(message, level = 'info') {
    if (verboseMode || level === 'error' || level === 'warn') {
        const timestamp = new Date().toISOString();
        const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function inlineAssets(html, fileType, files, sourceDir) {
    let modifiedHtml = html;
    
    for (const file of files) {
        try {
            const filePath = path.join(sourceDir, file);
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
                    log(`Inlined JS: ${file}`);
                }
            } else if (fileType === 'css') {
                const regex = new RegExp(`<link[^>]*href=["']${escapeRegex(file)}["'][^>]*>`, 'gi');
                modifiedHtml = modifiedHtml.replace(regex, `<style>${content}</style>`);
                log(`Inlined CSS: ${file}`);
            }
        } catch (error) {
            log(`Failed to inline ${fileType} file ${file}: ${error.message}`, 'warn');
        }
    }
    
    return modifiedHtml;
}

async function build() {
    const startTime = Date.now();
    
    try {
        log('🚀 Starting hybrid build (inline + l13)...', 'info');
        
        // Clean up previous builds
        if (await fs.pathExists(tempDir)) {
            await fs.remove(tempDir);
        }
        if (await fs.pathExists(distDir)) {
            await fs.remove(distDir);
        }
        
        // Create temp directory
        await fs.ensureDir(tempDir);
        
        // Copy source files to temp directory
        await fs.copy(srcDir, tempDir);
        log('📁 Copied source files to temp directory', 'info');
        
        // Get list of files to inline
        const htmlFiles = (await fs.readdir(tempDir)).filter(f => f.endsWith('.html'));
        const jsFiles = (await fs.readdir(tempDir)).filter(f => f.endsWith('.js'));
        const cssFiles = (await fs.readdir(tempDir)).filter(f => f.endsWith('.css'));
        
        // Inline JS and CSS into HTML files
        log('🔗 Inlining assets...', 'info');
        for (const htmlFile of htmlFiles) {
            const htmlPath = path.join(tempDir, htmlFile);
            let html = await fs.readFile(htmlPath, 'utf8');
            
            // Inline JS and CSS
            html = inlineAssets(html, 'js', jsFiles, tempDir);
            html = inlineAssets(html, 'css', cssFiles, tempDir);
            
            await fs.writeFile(htmlPath, html, 'utf8');
            log(`✅ Inlined assets into ${htmlFile}`);
        }
        
        // Remove the now-unused JS and CSS files
        await Promise.all([
            ...jsFiles.map(file => fs.remove(path.join(tempDir, file))),
            ...cssFiles.map(file => fs.remove(path.join(tempDir, file)))
        ]);
        
        log('🧹 Removed source JS/CSS files (now inlined)', 'info');
        
        // Create a simple Vite config for l13
        const viteConfig = `
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
`;
        await fs.writeFile(path.join(tempDir, 'vite.config.js'), viteConfig);
        log('📝 Created Vite config for l13', 'info');
        
        // Now use l13 to build the inlined files
        log('🔧 Running l13 build on inlined files...', 'info');
        
        // Change to temp directory and run l13
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        
        try {
            execSync('npx l13 build', { 
                stdio: 'inherit',
                env: { ...process.env, FORCE_COLOR: '1' }
            });
            log('✅ l13 build completed successfully', 'info');
        } catch (error) {
            log(`❌ l13 build failed: ${error.message}`, 'error');
            throw error;
        } finally {
            process.chdir(originalCwd);
        }
        
        // Copy the l13 output to our dist directory
        const l13OutputDir = path.join(tempDir, 'dist');
        if (await fs.pathExists(l13OutputDir)) {
            await fs.copy(l13OutputDir, distDir);
            log('✅ Copied l13 output to dist directory', 'info');
        } else {
            // If l13 didn't create a dist folder, copy the temp files
            await fs.copy(tempDir, distDir);
            log('⚠️ Copied temp files to dist directory (l13 may not have created dist)', 'warn');
        }
        
        // Show final results
        const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
        log(`🎉 Hybrid build completed in ${buildTime}s`, 'info');
        
        // List what was created
        const finalFiles = await fs.readdir(distDir);
        log(`📋 Final output files: ${finalFiles.join(', ')}`, 'info');
        
        // Show file sizes
        for (const file of finalFiles) {
            const filePath = path.join(distDir, file);
            const stats = await fs.stat(filePath);
            log(`📄 ${file}: ${stats.size} bytes`, 'info');
        }
        
        // Check if we have the expected output
        const indexFile = path.join(distDir, 'index.html');
        if (await fs.pathExists(indexFile)) {
            const indexStats = await fs.stat(indexFile);
            log(`🎯 Final index.html size: ${indexStats.size} bytes`, 'info');
            
            if (indexStats.size < 1000) {
                log('⚠️ Warning: index.html seems very small, inlining may have failed', 'warn');
            }
        }
        
    } catch (error) {
        log(`❌ Build failed: ${error.message}`, 'error');
        throw error;
    } finally {
        // Clean up temp directory
        if (await fs.pathExists(tempDir)) {
            await fs.remove(tempDir);
            log('🧹 Cleaned up temp directory', 'info');
        }
    }
}

// Run the build
build().catch((error) => {
    console.error('Build failed:', error.message);
    process.exit(1);
});
