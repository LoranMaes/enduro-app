<?php

namespace App\Enums;

enum GoalSport: string
{
    case Run = 'run';
    case Bike = 'bike';
    case Swim = 'swim';
    case Other = 'other';
}
