<?php

namespace App\Providers;

use App\Models\Activity;
use App\Models\TrainingPlan;
use App\Models\TrainingSession;
use App\Models\TrainingWeek;
use App\Policies\ActivityPolicy;
use App\Policies\TrainingPlanPolicy;
use App\Policies\TrainingSessionPolicy;
use App\Policies\TrainingWeekPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configurePolicies();
        $this->configureDefaults();
    }

    /**
     * Register model policy mappings.
     */
    protected function configurePolicies(): void
    {
        Gate::policy(TrainingPlan::class, TrainingPlanPolicy::class);
        Gate::policy(TrainingWeek::class, TrainingWeekPolicy::class);
        Gate::policy(TrainingSession::class, TrainingSessionPolicy::class);
        Gate::policy(Activity::class, ActivityPolicy::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
