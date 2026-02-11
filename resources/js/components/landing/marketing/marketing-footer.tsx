import React from 'react';

export function MarketingFooter() {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="border-t border-border px-6 py-12 text-center md:text-left">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
                <div className="space-y-1">
                    <div className="font-mono text-xs font-bold tracking-wider text-white uppercase">
                        Endure
                    </div>
                    <div className="text-[0.625rem] text-zinc-600">
                        © {currentYear} Performance Systems.
                    </div>
                </div>
                <div className="font-mono text-[0.625rem] text-zinc-700">
                    v1.0.0-beta
                </div>
            </div>
        </footer>
    );
}
