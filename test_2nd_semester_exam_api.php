<?php

// Test the exam API for 2nd semester
$semester = '2025-2026 2nd semester';
$root = 'http://localhost:8000';
$url = $root . '/api/exams?semester=' . urlencode($semester);

echo "Testing 2nd semester exam API...\n";
echo "URL: $url\n";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Accept: application/json'
    ]
]);

$response = file_get_contents($url, false, $context);
if ($response === false) {
    echo "Error: Could not fetch data\n";
    exit(1);
}

$data = json_decode($response, true);
echo "Number of cadets returned: " . count($data) . "\n";
echo "Cadets in 2nd semester:\n";
foreach ($data as $cadet) {
    echo "- " . ($cadet['last_name'] ?? 'Unknown') . ", " . ($cadet['first_name'] ?? 'Unknown') . "\n";
}

// Now test 1st semester for comparison
echo "\n--- Testing 1st semester for comparison ---\n";
$semester1 = '2025-2026 1st semester';
$url1 = $root . '/api/exams?semester=' . urlencode($semester1);

$response1 = file_get_contents($url1, false, $context);
if ($response1 !== false) {
    $data1 = json_decode($response1, true);
    echo "Number of cadets in 1st semester: " . count($data1) . "\n";
    echo "Cadets in 1st semester:\n";
    foreach ($data1 as $cadet) {
        echo "- " . ($cadet['last_name'] ?? 'Unknown') . ", " . ($cadet['first_name'] ?? 'Unknown') . "\n";
    }
}