import { ChevronDown } from 'lucide-react';

export default function ModelDropdown({
  modelOptions,
  selectedModel,
  setSelectedModel,
}: {
  modelOptions: { label: string; value: string }[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}) {
  return (
    <div className="relative">
      <button
        className="flex items-center text-xs h-auto p-1 rounded hover:bg-muted transition"
        type="button"
      >
        <ChevronDown className="h-3 w-3 mr-1" />
        {modelOptions.find(m => m.value === selectedModel)?.label}
      </button>
      <div className="absolute left-0 mt-1 w-40 bg-card border border-border rounded shadow-lg z-10 hidden group-hover:block">
        {modelOptions.map((option) => (
          <div
            key={option.value}
            className={`px-3 py-2 cursor-pointer hover:bg-muted ${selectedModel === option.value ? 'font-bold' : ''}`}
            onClick={() => setSelectedModel(option.value)}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}