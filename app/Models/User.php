<?php

namespace App\Models;

use App\Enums\UserRole;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'strava_access_token',
        'strava_refresh_token',
        'strava_token_expires_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'strava_access_token',
        'strava_refresh_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'strava_token_expires_at' => 'datetime',
        ];
    }

    public function athleteProfile(): HasOne
    {
        return $this->hasOne(AthleteProfile::class);
    }

    public function coachProfile(): HasOne
    {
        return $this->hasOne(CoachProfile::class);
    }

    public function coachedAthletes(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'coach_athlete_assignments',
            'coach_id',
            'athlete_id',
        )->withTimestamps();
    }

    public function coaches(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'coach_athlete_assignments',
            'athlete_id',
            'coach_id',
        )->withTimestamps();
    }

    public function trainingPlans(): HasMany
    {
        return $this->hasMany(TrainingPlan::class);
    }

    public function trainingSessions(): HasMany
    {
        return $this->hasMany(TrainingSession::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'athlete_id');
    }

    public function activityProviderConnections(): HasMany
    {
        return $this->hasMany(ActivityProviderConnection::class);
    }

    public function isAthlete(): bool
    {
        return $this->role === null || $this->role === UserRole::Athlete;
    }

    public function isCoach(): bool
    {
        return $this->role === UserRole::Coach;
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function canManageActivityProviderConnections(): bool
    {
        return $this->isAthlete() || $this->isAdmin();
    }
}
