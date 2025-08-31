<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add new normalized fields
            $table->string('year')->nullable()->after('year_course_section');
            $table->string('course')->nullable()->after('year');
            $table->string('section')->nullable()->after('course');
        });

        // Migrate existing data
        $this->migrateExistingData();

        // Drop the old field
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('year_course_section');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Recreate the old field
            $table->string('year_course_section')->nullable()->after('campus');
            
            // Drop the new fields
            $table->dropColumn(['year', 'course', 'section']);
        });

        // Restore old data format
        $this->restoreOldData();
    }

    /**
     * Migrate existing year_course_section data to separate fields
     */
    private function migrateExistingData(): void
    {
        $users = DB::table('users')->whereNotNull('year_course_section')->get();
        
        foreach ($users as $user) {
            $parts = $this->parseYearCourseSection($user->year_course_section);
            
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'year' => $parts['year'],
                    'course' => $parts['course'],
                    'section' => $parts['section']
                ]);
        }
    }

    /**
     * Restore old data format when rolling back
     */
    private function restoreOldData(): void
    {
        $users = DB::table('users')->whereNotNull('year')->get();
        
        foreach ($users as $user) {
            $yearCourseSection = $this->combineYearCourseSection($user->year, $user->course, $user->section);
            
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'year_course_section' => $yearCourseSection
                ]);
        }
    }

    /**
     * Parse year_course_section string into separate components
     */
    private function parseYearCourseSection(string $yearCourseSection): array
    {
        // Handle common formats like "BSIT 1G-G1", "BSIT 2G", "BSIT 3H-G2"
        $pattern = '/^([A-Z]+)\s+(\d+[G|H])(?:-([G]\d+))?$/';
        
        if (preg_match($pattern, $yearCourseSection, $matches)) {
            return [
                'course' => $matches[1], // BSIT
                'year' => $matches[2],   // 1G, 2G, 3H, 4H
                'section' => $matches[3] ?? '' // G1, G2 (optional)
            ];
        }
        
        // Fallback: split by space and try to identify components
        $parts = explode(' ', $yearCourseSection);
        
        if (count($parts) >= 2) {
            $course = $parts[0];
            $yearSection = $parts[1];
            
            // Try to separate year and section
            if (preg_match('/^(\d+[G|H])(?:-([G]\d+))?$/', $yearSection, $yearMatches)) {
                return [
                    'course' => $course,
                    'year' => $yearMatches[1],
                    'section' => $yearMatches[2] ?? ''
                ];
            }
            
            return [
                'course' => $course,
                'year' => $yearSection,
                'section' => ''
            ];
        }
        
        // Default fallback
        return [
            'course' => $yearCourseSection,
            'year' => '',
            'section' => ''
        ];
    }

    /**
     * Combine year, course, and section back to original format
     */
    private function combineYearCourseSection(string $year, string $course, string $section): string
    {
        $result = $course . ' ' . $year;
        
        if (!empty($section)) {
            $result .= '-' . $section;
        }
        
        return $result;
    }
};
