<?php

use Illuminate\Support\Facades\File;

it('renders the custom favicon assets in the app shell', function () {
    $response = $this->get(route('home'));

    $response->assertSuccessful();
    $response->assertSee('<link rel="icon" href="/favicon.ico" sizes="any">', false);
    $response->assertSee('<link rel="icon" href="/favicon.svg" type="image/svg+xml">', false);
    $response->assertSee('<link rel="apple-touch-icon" href="/apple-touch-icon.png">', false);

    expect(file_exists(public_path('favicon.ico')))->toBeTrue();
    expect(file_exists(public_path('favicon.svg')))->toBeTrue();
    expect(file_exists(public_path('apple-touch-icon.png')))->toBeTrue();
});

it('ensures top-level inertia pages declare a browser title', function () {
    $pageFiles = collect(File::allFiles(resource_path('js/pages')))
        ->filter(fn (\SplFileInfo $file) => $file->getExtension() === 'tsx')
        ->reject(fn (\SplFileInfo $file) => str_contains(
            $file->getPathname(),
            DIRECTORY_SEPARATOR.'components'.DIRECTORY_SEPARATOR,
        ));

    $missingTitles = $pageFiles
        ->filter(function (\SplFileInfo $file): bool {
            $source = File::get($file->getPathname());

            return ! str_contains($source, '<Head')
                && ! str_contains($source, 'pageTitle=')
                && ! str_contains($source, 'headTitle=');
        })
        ->map(function (\SplFileInfo $file): string {
            return str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname());
        })
        ->values()
        ->all();

    expect($missingTitles)->toBe([]);
});
