import { useState, useMemo } from "react";
import { Input } from "./ui/input";
import { Search as SearchIcon } from "lucide-react";

interface SearchBarProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearchChange, placeholder = "Search devices or issues..." }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  return (
    <div className="relative mb-6">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-blue-400 rounded-xl shadow-sm"
      />
    </div>
  );
}
