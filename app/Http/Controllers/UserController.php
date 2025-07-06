<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get all users (excluding admins)
     */
    public function index()
    {
        // Get all users with role 'user' (excluding admins)
        $users = User::where('role', '!=', 'admin')
                     ->orderBy('last_name')
                     ->get();
        
        return response()->json($users);
    }
}
