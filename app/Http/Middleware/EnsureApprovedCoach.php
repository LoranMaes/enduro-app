<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

class EnsureApprovedCoach
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->isCoach()) {
            return $next($request);
        }

        $user->loadMissing('coachProfile');

        if ($user->coachProfile?->is_approved === true) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            abort(403, 'Coach account approval is pending.');
        }

        $currentRouteName = Route::currentRouteName();

        if ($currentRouteName === 'coach.pending-approval') {
            return $next($request);
        }

        return redirect()->route('coach.pending-approval');
    }
}
