<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\ActivityProviders\Exceptions\UnsupportedActivityProviderException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class ActivityProviderConnectController extends Controller
{
    public function __construct(
        private readonly ActivityProviderManager $providerManager,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, string $provider): RedirectResponse|Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        abort_unless($user->canManageActivityProviderConnections(), 403);

        try {
            $oauthProvider = $this->providerManager->oauthProvider($provider);
        } catch (UnsupportedActivityProviderException) {
            abort(404);
        }

        $state = Str::random(40);

        $request->session()->put(
            $this->stateSessionKey($provider),
            $state,
        );

        $authorizationUrl = $oauthProvider->authorizationUrl($user, $state);

        if ($request->header('X-Inertia') !== null) {
            return Inertia::location($authorizationUrl);
        }

        return redirect()->away($authorizationUrl);
    }

    private function stateSessionKey(string $provider): string
    {
        return 'activity_provider_oauth_state.'.strtolower(trim($provider));
    }
}
