<?php

namespace App\Enums;

enum TicketType: string
{
    case Bug = 'bug';
    case Feature = 'feature';
    case Chore = 'chore';
    case Support = 'support';
}
