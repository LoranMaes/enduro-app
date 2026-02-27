<?php

namespace App\Enums;

enum GoalType: string
{
    case Race = 'race';
    case Distance = 'distance';
    case Performance = 'performance';
    case Text = 'text';
}
