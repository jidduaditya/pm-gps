import { cn } from "@/lib/utils";

interface ChipSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multi?: boolean;
}

const ChipSelect = ({ options, selected, onChange, multi = true }: ChipSelectProps) => {
  const toggle = (option: string) => {
    if (multi) {
      onChange(
        selected.includes(option)
          ? selected.filter((s) => s !== option)
          : [...selected, option]
      );
    } else {
      onChange(selected.includes(option) ? [] : [option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            selected.includes(option)
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:border-primary/50"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default ChipSelect;
