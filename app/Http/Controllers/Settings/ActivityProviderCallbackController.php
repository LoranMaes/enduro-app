<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityProviders\ActivityProviderConnectionStore;
use App\Services\ActivityProviders\ActivityProviderManager;
use App\Services\ActivityProviders\Exceptions\ActivityProviderRequestException;
use App\Services\ActivityProviders\Exceptions\ActivityProviderUnauthorizedException;
use App\Services\ActivityProviders\Exceptions\UnsupportedActivityProviderException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ActivityProviderCallbackController extends Controller
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

        $expectedState = (string) $request->session()->pull(
            $this->stateSessionKey($provider),
            '',
        );
        $receivedState = trim((string) $request->query('state', ''));

        if ($expectedState === '' || ! hash_equals($expectedState, $receivedState)) {
            abort(403, 'Invalid OAuth state.');
        }

        $oauthError = trim((string) $request->query('error', ''));

        if ($oauthError !== '') {
            return to_route('settings.connections')
                ->with(
                    'activity_provider_connection_message',
                    "Connection cancelled: {$oauthError}.",
                );
        }

        $code = trim((string) $request->query('code', ''));

        if ($code === '') {
            return to_route('settings.connections')
                ->with(
                    'activity_provider_connection_message',
                    'Authorization code was not returned by provider.',
                );
        }

        try {
            $oauthProvider = $this->providerManager->oauthProvider($provider);
            $tokens = $oauthProvider->exchangeAuthorizationCode($code);
            $this->connectionStore->upsert(
                user: $user,
                provider: $provider,
                tokens: $tokens,
            );
        } catch (UnsupportedActivityProviderException) {
            abort(404);
        } catch (ActivityProviderUnauthorizedException|ActivityProviderRequestException $exception) {
            return to_route('settings.connections')
                ->with(
                    'activity_provider_connection_message',
                    $exception->getMessage(),
                );
        }

        return to_route('settings.connections')
            ->with(
                'activity_provider_connection_message',
                ucfirst(strtolower(trim($provider))).' connected successfully.',
            );
    }

    private function stateSessionKey(string $provider): string
    {
        return 'activity_provider_oauth_state.'.strtolower(trim($provider));
    }
}
