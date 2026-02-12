import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RegistrationForm } from '../types';

type CoachProfileStepProps = {
    form: RegistrationForm;
};

export function CoachProfileStep({ form }: CoachProfileStepProps) {
    return (
        <section className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="space-y-2">
                <Label htmlFor="coaching_experience">Coaching experience</Label>
                <Textarea
                    id="coaching_experience"
                    rows={4}
                    value={form.data.coaching_experience}
                    onChange={(event) =>
                        form.setData('coaching_experience', event.target.value)
                    }
                    placeholder="Share your coaching background, years active, and athlete profile."
                />
                <InputError message={form.errors.coaching_experience} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="specialties">Specialties</Label>
                <Textarea
                    id="specialties"
                    rows={3}
                    value={form.data.specialties}
                    onChange={(event) =>
                        form.setData('specialties', event.target.value)
                    }
                    placeholder="Examples: long-course triathlon, run performance, bike power development."
                />
                <InputError message={form.errors.specialties} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="website_url">Website or profile URL</Label>
                <Input
                    id="website_url"
                    value={form.data.website_url}
                    onChange={(event) =>
                        form.setData('website_url', event.target.value)
                    }
                    placeholder="https://"
                />
                <InputError message={form.errors.website_url} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="certifications_summary">
                    Certifications summary (optional)
                </Label>
                <Textarea
                    id="certifications_summary"
                    rows={2}
                    value={form.data.certifications_summary}
                    onChange={(event) =>
                        form.setData(
                            'certifications_summary',
                            event.target.value,
                        )
                    }
                    placeholder="List the credentials you hold."
                />
                <InputError message={form.errors.certifications_summary} />
            </div>
        </section>
    );
}
