<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $this->shouldLog($request)) {
            return $response;
        }

        $user = $request->user();

        if (! $user instanceof User) {
            return $response;
        }

        activity('http')
            ->causedBy($user)
            ->event(Str::lower($request->method()))
            ->withProperties([
                'method' => $request->method(),
                'path' => '/'.ltrim($request->path(), '/'),
                'route' => $request->route()?->getName(),
                'route_parameters' => $this->sanitizeRouteParameters(
                    $request->route()?->parameters() ?? [],
                ),
                'ip' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 255, ''),
                'status_code' => $response->getStatusCode(),
                'request' => $this->sanitizePayload($request->except([
                    '_token',
                    '_method',
                ])),
            ])
            ->log($this->buildDescription($request));

        return $response;
    }

    private function shouldLog(Request $request): bool
    {
        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return false;
        }

        $routeName = $request->route()?->getName();

        return $routeName !== 'broadcasting.auth';
    }

    private function buildDescription(Request $request): string
    {
        $routeName = $request->route()?->getName();

        if (is_string($routeName) && $routeName !== '') {
            return Str::lower($request->method()).' '.$routeName;
        }

        return Str::lower($request->method()).' /'.ltrim($request->path(), '/');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function sanitizePayload(array $payload): array
    {
        $hiddenKeys = [
            'password',
            'password_confirmation',
            'current_password',
            'access_token',
            'refresh_token',
            'authorization',
            'token',
            'two_factor_code',
            'two_factor_recovery_code',
        ];

        $sanitized = [];

        foreach ($payload as $key => $value) {
            $normalizedKey = Str::lower((string) $key);

            if (in_array($normalizedKey, $hiddenKeys, true)) {
                $sanitized[$key] = '[redacted]';

                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizePayload(Arr::except(
                    $value,
                    ['password', 'password_confirmation', 'token'],
                ));

                continue;
            }

            if (is_string($value)) {
                $sanitized[$key] = Str::limit($value, 300, '...');

                continue;
            }

            $sanitized[$key] = $value;
        }

        return $sanitized;
    }

    /**
     * @param  array<string, mixed>  $parameters
     * @return array<string, mixed>
     */
    private function sanitizeRouteParameters(array $parameters): array
    {
        $sanitized = [];

        foreach ($parameters as $key => $value) {
            if (is_scalar($value) || $value === null) {
                $sanitized[$key] = $value;

                continue;
            }

            if (is_object($value) && method_exists($value, 'getKey')) {
                $sanitized[$key] = $value->getKey();

                continue;
            }

            $sanitized[$key] = '[complex]';
        }

        return $sanitized;
    }
}
