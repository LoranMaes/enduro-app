<?php

namespace App\Enums;

enum UserRole: string
{
    case Athlete = 'athlete';
    case Coach = 'coach';
    case Admin = 'admin';
}
