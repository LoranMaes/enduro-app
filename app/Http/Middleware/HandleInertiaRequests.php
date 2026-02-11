<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $impersonationContext = $this->resolveImpersonationContext($request, $user);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'impersonating' => $impersonationContext['impersonating'],
                'original_user' => $impersonationContext['original_user'],
                'impersonated_user' => $impersonationContext['impersonated_user'],
            ],
            'admin_notifications' => [
                'unread_count' => $this->resolveAdminUnreadNotifications($user, $impersonationContext['impersonating']),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array{
     *     impersonating: bool,
     *     original_user: array{id: int, name: string, first_name: string|null, last_name: string|null, email: string, role: string|null}|null,
     *     impersonated_user: array{id: int, name: string, first_name: string|null, last_name: string|null, email: string, role: string|null}|null
     * }
     */
    private function resolveImpersonationContext(Request $request, ?User $user): array
    {
        $originalUserId = $request->session()->get('impersonation.original_user_id');
        $impersonatedUserId = $request->session()->get('impersonation.impersonated_user_id');

        if ($originalUserId === null || $impersonatedUserId === null || $user === null) {
            return [
                'impersonating' => false,
                'original_user' => null,
                'impersonated_user' => null,
            ];
        }

        $originalUser = User::query()->find((int) $originalUserId);
        $impersonatedUser = User::query()->find((int) $impersonatedUserId);

        if (
            $originalUser === null ||
            ! $originalUser->isAdmin() ||
            $impersonatedUser === null ||
            ! $impersonatedUser->is($user)
        ) {
            $request->session()->forget([
                'impersonation.original_user_id',
                'impersonation.impersonated_user_id',
            ]);

            return [
                'impersonating' => false,
                'original_user' => null,
                'impersonated_user' => null,
            ];
        }

        return [
            'impersonating' => true,
            'original_user' => $this->toSharedUser($originalUser),
            'impersonated_user' => $this->toSharedUser($impersonatedUser),
        ];
    }

    /**
     * @return array{id: int, name: string, first_name: string|null, last_name: string|null, email: string, role: string|null}
     */
    private function toSharedUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->fullName(),
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'role' => $user->role?->value,
        ];
    }

    private function resolveAdminUnreadNotifications(?User $user, bool $isImpersonating): int
    {
        if (! $user instanceof User || ! $user->isAdmin() || $isImpersonating) {
            return 0;
        }

        return $user->unreadNotifications()->count();
    }
}
