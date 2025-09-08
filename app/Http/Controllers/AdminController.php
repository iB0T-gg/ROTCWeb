<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\UserApprovalNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class AdminController extends Controller
{
    /**
     * Get pending users for approval
     */
    public function getPendingUsers()
    {
        $pendingUsers = User::where('status', 'pending')
                           ->whereIn('role', ['user', 'faculty'])  // Include both users and faculty
                           ->orderBy('created_at', 'desc')
                           ->get();
        
        return response()->json($pendingUsers);
    }

    /**
     * Approve a user
     */
    public function approveUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::findOrFail($request->user_id);
        
        // Only allow approving pending regular users or faculty
        if (!in_array($user->role, ['user', 'faculty'])) {
            return response()->json(['error' => 'Only regular users and faculty can be approved'], 400);
        }
        
        if ($user->status !== 'pending') {
            return response()->json(['error' => 'User is not pending approval'], 400);
        }

        $user->update(['status' => 'approved']);

        // Send approval notification email
        try {
            $user->notify(new UserApprovalNotification('approved', $user));
        } catch (\Exception $e) {
            // Log the error but don't fail the approval
            \Log::error('Failed to send approval email: ' . $e->getMessage());
        }

        return response()->json(['message' => 'User approved successfully', 'user' => $user]);
    }

    /**
     * Reject a user
     */
    public function rejectUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::findOrFail($request->user_id);
        
        // Only allow rejecting pending regular users or faculty
        if (!in_array($user->role, ['user', 'faculty'])) {
            return response()->json(['error' => 'Only regular users and faculty can be rejected'], 400);
        }
        
        if ($user->status !== 'pending') {
            return response()->json(['error' => 'User is not pending approval'], 400);
        }

        $user->update(['status' => 'rejected']);

        // Send rejection notification email
        try {
            $user->notify(new UserApprovalNotification('rejected', $user));
        } catch (\Exception $e) {
            // Log the error but don't fail the rejection
            \Log::error('Failed to send rejection email: ' . $e->getMessage());
        }

        return response()->json(['message' => 'User rejected successfully', 'user' => $user]);
    }
    
    /**
     * Archive a user
     */
    public function archiveUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::findOrFail($request->user_id);
        
        // Only allow archiving non-admin users
        if ($user->role === 'admin') {
            return response()->json(['error' => 'Admin users cannot be archived'], 400);
        }
        
        // Archive the user
        $user->update([
            'archived' => true,
            'archived_at' => Carbon::now()
        ]);

        return response()->json(['message' => 'User archived successfully', 'user' => $user]);
    }
    
    /**
     * Restore an archived user
     */
    public function restoreUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::findOrFail($request->user_id);
        
        // Only restore if the user is actually archived
        if (!$user->archived) {
            return response()->json(['error' => 'User is not archived'], 400);
        }
        
        // Restore the user
        $user->update([
            'archived' => false,
            'archived_at' => null,
            'status' => 'approved' // Ensure they are approved when restored
        ]);

        return response()->json(['message' => 'User restored successfully', 'user' => $user]);
    }
    
    /**
     * Get all archived users
     */
    public function getArchivedUsers()
    {
        $archivedUsers = User::where('archived', true)
                            ->orderBy('archived_at', 'desc')
                            ->get();
        
        return response()->json($archivedUsers);
    }
} 