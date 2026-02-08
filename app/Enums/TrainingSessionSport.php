<?php

namespace App\Enums;

enum TrainingSessionSport: string
{
    case Swim = 'swim';
    case Bike = 'bike';
    case Run = 'run';
    case Gym = 'gym';
    case Other = 'other';
}
