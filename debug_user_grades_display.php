<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;

echo "=== DEBUGGING USER GRADES DISPLAY ISSUE ===\n\n";

// Check what's in the user_grades table
echo "1. Current data in user_grades table:\n";
$allUserGrades = DB::table('user_grades')->get();
foreach ($allUserGrades as $grade) {
    $user = DB::table('users')->where('id', $grade->user_id)->first();
    $userName = $user ? "{$user->first_name} {$user->last_name}" : "User {$grade->user_id}";
    echo "   - {$userName}: {$grade->semester} - Grade: {$grade->equivalent_grade}, Remarks: {$grade->remarks}\n";
}

echo "\n2. Testing UserController getUserGrades method:\n";

// Find a user with posted grades (like Willis)
$willis = DB::table('users')->where('first_name', 'Willis')->first();
if ($willis) {
    echo "   Testing with Willis (ID: {$willis->id})\n";
    
    // Test the getUserGrades method directly
    $userController = new UserController();
    
    try {
        // Create a mock request
        $request = new Request();
        
        // Mock the authenticated user
        $willisUser = \App\Models\User::find($willis->id);
        auth()->login($willisUser);
        
        $response = $userController->getUserGrades($request);
        $responseData = json_decode($response->getContent(), true);
        
        echo "   API Response for Willis:\n";
        echo "   {\n";
        echo "     \"id\": {$responseData['id']},\n";
        echo "     \"first_name\": \"{$responseData['first_name']}\",\n";
        echo "     \"last_name\": \"{$responseData['last_name']}\",\n";
        echo "     \"email\": \"{$responseData['email']}\",\n";
        echo "     \"first_semester\": {\n";
        echo "       \"equivalent_grade\": " . json_encode($responseData['first_semester']['equivalent_grade']) . ",\n";
        echo "       \"remarks\": " . json_encode($responseData['first_semester']['remarks']) . ",\n";
        echo "       \"final_grade\": " . json_encode($responseData['first_semester']['final_grade']) . "\n";
        echo "     },\n";
        echo "     \"second_semester\": {\n";
        echo "       \"equivalent_grade\": " . json_encode($responseData['second_semester']['equivalent_grade']) . ",\n";
        echo "       \"remarks\": " . json_encode($responseData['second_semester']['remarks']) . ",\n";
        echo "       \"final_grade\": " . json_encode($responseData['second_semester']['final_grade']) . "\n";
        echo "     }\n";
        echo "   }\n";
        
        // Check if the values are being returned correctly
        if ($responseData['first_semester']['equivalent_grade'] === null) {
            echo "   ⚠ First semester grade is null\n";
        } else {
            echo "   ✓ First semester grade: {$responseData['first_semester']['equivalent_grade']}\n";
        }
        
        if ($responseData['second_semester']['equivalent_grade'] === null) {
            echo "   ⚠ Second semester grade is null\n";
        } else {
            echo "   ✓ Second semester grade: {$responseData['second_semester']['equivalent_grade']}\n";
        }
        
    } catch (Exception $e) {
        echo "   ✗ Error testing getUserGrades: " . $e->getMessage() . "\n";
    }
}

echo "\n3. Check database queries used in getUserGrades:\n";

if ($willis) {
    // Test the exact queries used in getUserGrades
    echo "   Testing first semester query:\n";
    $firstSemGrade = DB::table('user_grades')
        ->where('user_id', $willis->id)
        ->where('semester', '2025-2026 1st semester')
        ->first();
    
    if ($firstSemGrade) {
        echo "   ✓ Found first semester: Grade {$firstSemGrade->equivalent_grade}, Remarks: {$firstSemGrade->remarks}\n";
    } else {
        echo "   ✗ No first semester grade found\n";
    }
    
    echo "   Testing second semester query:\n";
    $secondSemGrade = DB::table('user_grades')
        ->where('user_id', $willis->id)
        ->where('semester', '2025-2026 2nd semester')
        ->first();
    
    if ($secondSemGrade) {
        echo "   ✓ Found second semester: Grade {$secondSemGrade->equivalent_grade}, Remarks: {$secondSemGrade->remarks}\n";
    } else {
        echo "   ✗ No second semester grade found\n";
    }
}

echo "\n4. Test with Galvez (from the screenshot):\n";

$galvez = DB::table('users')->where('first_name', 'Jewell')->where('last_name', 'Galvez')->first();
if ($galvez) {
    echo "   Found Galvez (ID: {$galvez->id})\n";
    
    $galvezGrades = DB::table('user_grades')->where('user_id', $galvez->id)->get();
    echo "   Galvez has " . count($galvezGrades) . " posted grades:\n";
    foreach ($galvezGrades as $grade) {
        echo "     {$grade->semester}: Grade {$grade->equivalent_grade}, Remarks: {$grade->remarks}\n";
    }
    
    if (count($galvezGrades) == 0) {
        echo "   ⚠ Galvez has no posted grades! This explains the '-' in the interface.\n";
    }
} else {
    echo "   ✗ Galvez not found in users table\n";
}

echo "\n=== DEBUGGING COMPLETE ===\n";