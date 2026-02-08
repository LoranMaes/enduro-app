<?php

namespace App\Data\Collections;

use App\Data\ExternalActivityDTO;
use Illuminate\Support\Collection;
use InvalidArgumentException;

/**
 * @extends Collection<int, ExternalActivityDTO>
 */
class ActivityCollection extends Collection
{
    /**
     * @param  iterable<int, ExternalActivityDTO>  $items
     */
    public function __construct($items = [])
    {
        parent::__construct($items);
    }

    /**
     * @param  mixed  $item
     */
    public function push(...$item): static
    {
        foreach ($item as $activity) {
            if (! $activity instanceof ExternalActivityDTO) {
                throw new InvalidArgumentException('ActivityCollection only accepts ExternalActivityDTO instances.');
            }
        }

        return parent::push(...$item);
    }
}
