<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\TrainingPlanController;
use App\Http\Controllers\Api\TrainingSessionController;
use App\Http\Controllers\Api\TrainingWeekController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function (): void {
    Route::apiResource('training-plans', TrainingPlanController::class);
    Route::apiResource('training-weeks', TrainingWeekController::class);
    Route::apiResource('training-sessions', TrainingSessionController::class);
    Route::apiResource('activities', ActivityController::class);
});
