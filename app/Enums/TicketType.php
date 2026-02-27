<?php

namespace App\Enums;

enum TicketType: string
{
    case Bug = 'bug';
    case Feature = 'feature';
    case Chore = 'chore';
    case Support = 'support';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
