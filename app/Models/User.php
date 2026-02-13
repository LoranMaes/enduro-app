<?php

namespace App\Models;

use App\Enums\UserRole;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;

    use LogsActivity;
    use Notifiable;
    use TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'password',
        'role',
        'timezone',
        'unit_system',
        'strava_access_token',
        'strava_refresh_token',
        'strava_token_expires_at',
        'is_subscribed',
        'suspended_at',
        'suspended_by_user_id',
        'suspension_reason',
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
            'first_name' => 'string',
            'last_name' => 'string',
            'timezone' => 'string',
            'unit_system' => 'string',
            'is_subscribed' => 'boolean',
            'strava_token_expires_at' => 'datetime',
            'suspended_at' => 'datetime',
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

    public function coachApplication(): HasOne
    {
        return $this->hasOne(CoachApplication::class);
    }

    public function suspendedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'suspended_by_user_id');
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

    public function calendarEntries(): HasMany
    {
        return $this->hasMany(CalendarEntry::class);
    }

    public function goals(): HasMany
    {
        return $this->hasMany(Goal::class);
    }

    public function annualTrainingPlans(): HasMany
    {
        return $this->hasMany(AnnualTrainingPlan::class);
    }

    public function workoutLibraryItems(): HasMany
    {
        return $this->hasMany(WorkoutLibraryItem::class);
    }

    public function activityProviderConnections(): HasMany
    {
        return $this->hasMany(ActivityProviderConnection::class);
    }

    public function createdTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'creator_admin_id');
    }

    public function assignedTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'assignee_admin_id');
    }

    public function ticketInternalNotes(): HasMany
    {
        return $this->hasMany(TicketInternalNote::class, 'admin_id');
    }

    public function ticketComments(): HasMany
    {
        return $this->hasMany(TicketComment::class, 'admin_id');
    }

    public function receivedTicketMentions(): HasMany
    {
        return $this->hasMany(TicketMention::class, 'mentioned_admin_id');
    }

    public function createdTicketMentions(): HasMany
    {
        return $this->hasMany(TicketMention::class, 'mentioned_by_admin_id');
    }

    public function ticketAuditLogs(): HasMany
    {
        return $this->hasMany(TicketAuditLog::class, 'actor_admin_id');
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

    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    public function canManageActivityProviderConnections(): bool
    {
        return $this->isAthlete() || $this->isAdmin();
    }

    public function fullName(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->last_name,
        ], static fn (?string $value): bool => $value !== null && trim($value) !== '');

        if ($parts === []) {
            return $this->name;
        }

        return implode(' ', $parts);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('user')
            ->logOnly([
                'name',
                'first_name',
                'last_name',
                'email',
                'email_verified_at',
                'role',
                'timezone',
                'unit_system',
                'suspended_at',
                'suspended_by_user_id',
                'suspension_reason',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
