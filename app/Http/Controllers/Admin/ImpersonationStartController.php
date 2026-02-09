<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonationStartController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin !== null && $admin->isAdmin(), 403);

        abort_if(
            $request->session()->has('impersonation.original_user_id'),
            409,
            'Nested impersonation is not allowed.',
        );

        abort_if($user->isAdmin(), 422, 'Impersonating another admin is not supported.');
        abort_if($user->isSuspended(), 422, 'Suspended accounts cannot be impersonated.');

        if ($user->isCoach()) {
            $user->loadMissing('coachProfile');

            abort_if(
                $user->coachProfile?->is_approved !== true,
                422,
                'Pending or rejected coach accounts cannot be impersonated.',
            );
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->put('impersonation.original_user_id', $admin->id);
        $request->session()->put('impersonation.impersonated_user_id', $user->id);

        if ($user->isCoach()) {
            return redirect()->route('coaches.index');
        }

        return redirect()->route('dashboard');
    }
}
