<?php

namespace App\Enums;

enum CalendarEntryType: string
{
    case Event = 'event';
    case Goal = 'goal';
    case Note = 'note';
}
