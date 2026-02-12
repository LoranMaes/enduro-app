<?php

namespace App\Enums;

enum TrainingSessionSport: string
{
    case Swim = 'swim';
    case Bike = 'bike';
    case Run = 'run';
    case DayOff = 'day_off';
    case MtnBike = 'mtn_bike';
    case Custom = 'custom';
    case Walk = 'walk';
    case Gym = 'gym';
    case Other = 'other';
}
