<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderConnectionStore;
use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\ActivityProviders\Exceptions\UnsupportedActivityProviderException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ActivityProviderDisconnectController extends Controller
{
    public function __construct(
        private readonly ActivityProviderManager $providerManager,
        private readonly ActivityProviderConnectionStore $connectionStore,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, string $provider): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        abort_unless($user->canManageActivityProviderConnections(), 403);

        try {
            $this->providerManager->oauthProvider($provider);
        } catch (UnsupportedActivityProviderException) {
            abort(404);
        }

        $this->connectionStore->disconnect($user, $provider);

        return to_route('settings.connections')
            ->with(
                'activity_provider_connection_message',
                ucfirst(strtolower(trim($provider))).' disconnected.',
            );
    }
}
