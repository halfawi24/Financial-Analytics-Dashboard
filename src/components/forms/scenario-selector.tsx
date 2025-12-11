'use client';

import { Button } from '@/components/ui/button';

interface ScenarioSelectorProps {
  scenario: 'base' | 'best' | 'worst';
  onScenarioChange: (scenario: 'base' | 'best' | 'worst') => void;
}

export function ScenarioSelector({
  scenario,
  onScenarioChange,
}: ScenarioSelectorProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-sm font-medium text-muted-foreground mb-3">
        Scenario
      </p>
      <div className="flex gap-2">
        {(['base', 'best', 'worst'] as const).map((s) => (
          <Button
            key={s}
            onClick={() => onScenarioChange(s)}
            variant={scenario === s ? 'default' : 'outline'}
            size="sm"
            className="capitalize"
          >
            {s === 'base' ? 'Base Case' : s === 'best' ? 'Best Case' : 'Worst Case'}
          </Button>
        ))}
      </div>
    </div>
  );
}
