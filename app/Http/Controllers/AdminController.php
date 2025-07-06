<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\UserApprovalNotification;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Get pending users for approval
     */
    public function getPendingUsers()
    {
        $pendingUsers = User::where('status', 'pending')
                           ->where('role', 'user')  // Only regular users, not admins
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
        
        // Only allow approving pending regular users
        if ($user->role !== 'user') {
            return response()->json(['error' => 'Only regular users can be approved'], 400);
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
        
        // Only allow rejecting pending regular users
        if ($user->role !== 'user') {
            return response()->json(['error' => 'Only regular users can be rejected'], 400);
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
} 