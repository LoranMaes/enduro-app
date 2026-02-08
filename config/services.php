<?php

use App\Services\ActivityProviders\Strava\StravaActivityProvider;
use App\Services\ActivityProviders\Strava\StravaOAuthProvider;

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'activity_providers' => [
        'allowed' => array_values(array_filter(array_map('trim', explode(
            ',',
            (string) env('ACTIVITY_PROVIDERS_ALLOWED', 'strava'),
        )))),
        'providers' => [
            'strava' => StravaActivityProvider::class,
        ],
        'oauth_providers' => [
            'strava' => StravaOAuthProvider::class,
        ],
        'sync_lookback_days' => (int) env('ACTIVITY_PROVIDER_SYNC_LOOKBACK_DAYS', 90),
        'token_refresh_buffer_seconds' => (int) env('ACTIVITY_PROVIDER_TOKEN_REFRESH_BUFFER_SECONDS', 300),
        'sync_lock_seconds' => (int) env('ACTIVITY_PROVIDER_SYNC_LOCK_SECONDS', 300),
        'lock_retry_seconds' => (int) env('ACTIVITY_PROVIDER_LOCK_RETRY_SECONDS', 30),
    ],

    'strava' => [
        'base_url' => env('STRAVA_BASE_URL', 'https://www.strava.com/api/v3'),
        'oauth_base_url' => env('STRAVA_OAUTH_BASE_URL', 'https://www.strava.com'),
        'client_id' => env('STRAVA_CLIENT_ID'),
        'client_secret' => env('STRAVA_CLIENT_SECRET'),
        'redirect_uri' => env('STRAVA_REDIRECT_URI'),
        'scopes' => array_values(array_filter(array_map('trim', explode(
            ',',
            (string) env('STRAVA_SCOPES', 'read,activity:read_all'),
        )))),
        'webhook_verify_token' => env('STRAVA_WEBHOOK_VERIFY_TOKEN'),
        'webhook_subscription_id' => env('STRAVA_WEBHOOK_SUBSCRIPTION_ID'),
    ],

];
