<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo 'Users count: ' . DB::table('users')->count() . PHP_EOL;
echo 'First Semester Aptitude count: ' . DB::table('first_semester_aptitude')->count() . PHP_EOL;
echo 'Second Semester Aptitude count: ' . DB::table('second_semester_aptitude')->count() . PHP_EOL;
echo 'First Semester Attendance count: ' . DB::table('first_semester_attendance')->count() . PHP_EOL;
echo 'Second Semester Attendance count: ' . DB::table('second_semester_attendance')->count() . PHP_EOL;

