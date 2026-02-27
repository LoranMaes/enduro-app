<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoadHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $date = null;
        $sport = null;
        $tss = null;
        $atl = null;
        $ctl = null;
        $tsb = null;

        if (is_array($this->resource)) {
            $date = $this->resource['date'] ?? null;
            $sport = $this->resource['sport'] ?? null;
            $tss = $this->resource['tss'] ?? null;
            $atl = $this->resource['atl'] ?? null;
            $ctl = $this->resource['ctl'] ?? null;
            $tsb = $this->resource['tsb'] ?? null;
        } else {
            $date = $this->date?->toDateString() ?? null;
            $sport = $this->sport ?? null;
            $tss = $this->tss ?? null;
            $atl = $this->atl ?? null;
            $ctl = $this->ctl ?? null;
            $tsb = $this->tsb ?? null;
        }

        return [
            'date' => $date,
            'sport' => $sport,
            'tss' => (float) ($tss ?? 0),
            'atl' => (float) ($atl ?? 0),
            'ctl' => (float) ($ctl ?? 0),
            'tsb' => (float) ($tsb ?? 0),
        ];
    }
}
