<?php

/**
 * Hostinger Storage Setup Script
 * 
 * This script helps set up the proper directory structure and symbolic links
 * for file storage on Hostinger hosting.
 * 
 * Run this script after uploading your Laravel application to Hostinger.
 */

echo "=== HOSTINGER STORAGE SETUP ===\n\n";

// Check if we're in the correct directory
if (!file_exists('artisan')) {
    echo "❌ Error: This script must be run from the Laravel root directory.\n";
    echo "Make sure you're in the directory that contains artisan file.\n";
    exit(1);
}

echo "✅ Laravel root directory detected.\n\n";

// Create necessary directories
$directories = [
    'storage/app/public/avatars',
    'storage/app/public/cor_files',
    'storage/app/public/credentials_files',
    'public/storage'
];

echo "Creating directories...\n";
foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "✅ Created: $dir\n";
        } else {
            echo "❌ Failed to create: $dir\n";
        }
    } else {
        echo "✅ Already exists: $dir\n";
    }
}

echo "\n";

// Create symbolic link
echo "Creating symbolic link...\n";
$target = realpath('storage/app/public');
$link = 'public/storage';

// Remove existing link if it exists
if (is_link($link)) {
    unlink($link);
    echo "✅ Removed existing symbolic link\n";
}

// Create new symbolic link
if (symlink($target, $link)) {
    echo "✅ Created symbolic link: $link -> $target\n";
} else {
    echo "❌ Failed to create symbolic link\n";
    echo "You may need to create this manually:\n";
    echo "ln -s $target $link\n";
}

echo "\n";

// Set proper permissions
echo "Setting permissions...\n";
$permissions = [
    'storage' => 0755,
    'storage/app' => 0755,
    'storage/app/public' => 0755,
    'storage/app/public/avatars' => 0755,
    'storage/app/public/cor_files' => 0755,
    'storage/app/public/credentials_files' => 0755,
    'public/storage' => 0755
];

foreach ($permissions as $path => $perm) {
    if (file_exists($path)) {
        if (chmod($path, $perm)) {
            echo "✅ Set permissions for: $path\n";
        } else {
            echo "❌ Failed to set permissions for: $path\n";
        }
    }
}

echo "\n";

// Test file access
echo "Testing file access...\n";
$testFile = 'storage/app/public/test.txt';
file_put_contents($testFile, 'test');
if (file_exists($testFile)) {
    echo "✅ Can write to storage/app/public\n";
    unlink($testFile);
} else {
    echo "❌ Cannot write to storage/app/public\n";
}

// Check if symbolic link works
if (is_link('public/storage') && is_dir('public/storage')) {
    echo "✅ Symbolic link is working\n";
} else {
    echo "❌ Symbolic link is not working\n";
}

echo "\n=== SETUP COMPLETE ===\n";
echo "Your file storage should now work with Hostinger hosting.\n";
echo "Files will be accessible at: /public/storage/[filename]\n";
echo "\nNext steps:\n";
echo "1. Upload your Laravel application to Hostinger\n";
echo "2. Run this script on the server\n";
echo "3. Test file uploads in your application\n";
