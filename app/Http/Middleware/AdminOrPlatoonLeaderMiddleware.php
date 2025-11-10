<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminOrPlatoonLeaderMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() && in_array(Auth::user()->role, ['admin', 'platoon_leader'], true)) {
            return $next($request);
        }

        abort(403, 'Unauthorized');
    }
}

