<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonationStopController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $originalUserId = $request->session()->get('impersonation.original_user_id');
        $impersonatedUserId = $request->session()->get('impersonation.impersonated_user_id');

        if ($originalUserId === null || $impersonatedUserId === null) {
            abort(403);
        }

        $originalUser = User::query()->find((int) $originalUserId);

        if ($originalUser === null || ! $originalUser->isAdmin()) {
            $request->session()->forget([
                'impersonation.original_user_id',
                'impersonation.impersonated_user_id',
            ]);

            abort(403);
        }

        $request->session()->forget([
            'impersonation.original_user_id',
            'impersonation.impersonated_user_id',
        ]);

        Auth::guard('web')->login($originalUser);
        $request->session()->regenerate();

        return redirect()->route('admin.index');
    }
}
