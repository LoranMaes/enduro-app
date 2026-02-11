<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotImpersonating
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $isImpersonating = $request->session()->has('impersonation.original_user_id')
            && $request->session()->has('impersonation.impersonated_user_id');

        if (! $isImpersonating) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            abort(403, 'Impersonated sessions cannot access this resource.');
        }

        return redirect()->route('dashboard');
    }
}
