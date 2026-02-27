<?php

namespace App\Enums;

enum AthleteWeekLoadState: string
{
    case Low = 'low';
    case InRange = 'in_range';
    case High = 'high';
    case Insufficient = 'insufficient';
}
