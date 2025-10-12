<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix cor_file_path entries that contain /public/storage/ to use /storage/
        DB::table('users')
            ->whereNotNull('cor_file_path')
            ->where('cor_file_path', 'like', '%/public/storage/%')
            ->update([
                'cor_file_path' => DB::raw("REPLACE(cor_file_path, '/public/storage/', '/storage/')")
            ]);

        // Fix profile_pic_url entries that contain /public/storage/ to use /storage/
        DB::table('users')
            ->whereNotNull('profile_pic_url')
            ->where('profile_pic_url', 'like', '%/public/storage/%')
            ->update([
                'profile_pic_url' => DB::raw("REPLACE(profile_pic_url, '/public/storage/', '/storage/')")
            ]);

        // Note: profile_pic column doesn't exist, only profile_pic_url
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse the changes - convert /storage/ back to /public/storage/
        DB::table('users')
            ->whereNotNull('cor_file_path')
            ->where('cor_file_path', 'like', '%/storage/%')
            ->where('cor_file_path', 'not like', '%/public/storage/%')
            ->update([
                'cor_file_path' => DB::raw("REPLACE(cor_file_path, '/storage/', '/public/storage/')")
            ]);

        DB::table('users')
            ->whereNotNull('profile_pic_url')
            ->where('profile_pic_url', 'like', '%/storage/%')
            ->where('profile_pic_url', 'not like', '%/public/storage/%')
            ->update([
                'profile_pic_url' => DB::raw("REPLACE(profile_pic_url, '/storage/', '/public/storage/')")
            ]);

        // Note: profile_pic column doesn't exist, only profile_pic_url
    }
};