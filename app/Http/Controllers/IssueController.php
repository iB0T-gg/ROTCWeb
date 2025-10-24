<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class IssueController extends Controller
{
    /**
     * Display a listing of issues for administrators.
     */
    public function index()
    {
        // Only admins should be able to access this
        if (auth()->user()->role !== 'admin') {
            return redirect()->back()->with('error', 'Unauthorized access');
        }

        $issues = \App\Models\Issue::with(['user' => function($query) {
            $query->select('id', 'first_name', 'middle_name', 'last_name', 'email', 'role');
        }])->latest()->get();

        return inertia('admin/Issue', [
            'issues' => $issues
        ]);
    }

    /**
     * Store a newly reported issue.
     */
    public function store(Request $request)
    {
        $request->validate([
            'issue_type' => 'required|string',
            'description' => 'required|string',
            'is_anonymous' => 'boolean',
        ]);

        // Determine reporter type based on user role
        $reporterType = auth()->user()->role === 'user' ? 'cadet' : 'faculty';

        // Create the issue
        $issue = \App\Models\Issue::create([
            'user_id' => auth()->id(),
            'issue_type' => $request->issue_type,
            'description' => $request->description,
            'reporter_type' => $reporterType,
            'is_anonymous' => $request->input('is_anonymous', true), // Default to anonymous
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Issue reported successfully',
                'issue' => $issue
            ]);
        }

        return redirect()->back()->with('success', 'Issue reported successfully');
    }

    /**
     * Update an issue status and add a response.
     */
    public function update(Request $request, $id)
    {
        // Only admins should be able to update issues
        if (auth()->user()->role !== 'admin') {
            return redirect()->back()->with('error', 'Unauthorized access');
        }

        $request->validate([
            'status' => 'required|in:pending,in-progress,resolved',
            'admin_response' => 'nullable|string',
        ]);

        $issue = \App\Models\Issue::findOrFail($id);

        $issue->update([
            'status' => $request->status,
            'admin_response' => $request->admin_response,
            'resolved_at' => $request->status === 'resolved' ? now() : $issue->resolved_at,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Issue updated successfully',
                'issue' => $issue
            ]);
        }

        return redirect()->back()->with('success', 'Issue updated successfully');
    }

    /**
     * Display the issue reporting page for cadets.
     * Note: This method is no longer used as the route now handles the view directly.
     */
    public function userReportForm()
    {
        return inertia('user/userReportAnIssue', [
            'auth' => auth()->user()
        ]);
    }

    /**
     * Display the issue reporting page for faculty.
     * Note: This method is no longer used as the route now handles the view directly.
     */
    public function facultyReportForm()
    {
        return inertia('faculty/facultyReportAnIssue', [
            'auth' => auth()->user()
        ]);
    }
    
    /**
     * Get all issues for a specific user.
     */
    public function userIssues()
    {
        $issues = \App\Models\Issue::where('user_id', auth()->id())
            ->latest()
            ->get();
            
        return response()->json([
            'issues' => $issues
        ]);
    }
    
    /**
     * Get all issues for administrators.
     */
    public function getAllIssues()
    {
        // Only admins should be able to access this
        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $issues = \App\Models\Issue::with(['user' => function($query) {
            $query->select('id', 'first_name', 'middle_name', 'last_name', 'email', 'role');
        }])->latest()->get();
        
        // Format the issues to respect anonymity
        $formattedIssues = $issues->map(function($issue) {
            if ($issue->is_anonymous) {
                // If anonymous, remove user details
                return [
                    'id' => $issue->id,
                    'issue_type' => $issue->issue_type,
                    'description' => $issue->description,
                    'status' => $issue->status,
                    'reporter_type' => $issue->reporter_type,
                    'is_anonymous' => $issue->is_anonymous,
                    'admin_response' => $issue->admin_response,
                    'resolved_at' => $issue->resolved_at,
                    'created_at' => $issue->created_at,
                    'updated_at' => $issue->updated_at,
                    'user' => [
                        'id' => null,
                        'role' => $issue->reporter_type,
                        'first_name' => 'Anonymous',
                        'middle_name' => '',
                        'last_name' => ucfirst($issue->reporter_type),
                        'email' => null
                    ]
                ];
            } else {
                // If not anonymous, include user details
                return $issue;
            }
        });
        
        return response()->json([
            'issues' => $formattedIssues
        ]);
    }
}
