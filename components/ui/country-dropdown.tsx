"use client";

import React, { useMemo, useState } from "react";
import { Country, State } from "country-state-city";
import { CircleFlag } from "react-circle-flags";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CountryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CountryDropdown({ value, onChange, className, disabled }: CountryDropdownProps) {
  const [open, setOpen] = useState(false);
  const countries = useMemo(() => Country.getAllCountries(), []);
  
  const selectedCountry = useMemo(() => countries.find(c => c.isoCode === value), [value, countries]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between h-12 px-4 rounded-xl border border-[#E5E5EA] bg-white text-sm text-[#111111] focus:outline-none focus:border-[#9E9EA7] transition-colors disabled:opacity-50",
          className
        )}
      >
        {selectedCountry ? (
          <div className="flex items-center gap-2 truncate">
            <CircleFlag countryCode={selectedCountry.isoCode.toLowerCase()} height="16" width="16" />
            <span className="truncate">{selectedCountry.name}</span>
          </div>
        ) : (
          <span className="text-[#9E9EA7]">Select country...</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-[#6E6E73] opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search country..." 
            onValueChange={() => {
              const el = document.querySelector('[data-slot="command-list"]');
              if (el) el.scrollTop = 0;
            }} 
          />
          <CommandList className="max-h-[200px] scrollbar-thin scrollbar-thumb-[#E5E5EA]">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.isoCode}
                  value={country.name}
                  onSelect={() => {
                    onChange(country.isoCode);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <CircleFlag countryCode={country.isoCode.toLowerCase()} height="16" width="16" />
                  <span className="truncate flex-1">{country.name}</span>
                  {value === country.isoCode && (
                    <Check className="h-4 w-4 text-[#111111] ml-auto shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface StateDropdownProps {
  countryCode: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function StateDropdown({ countryCode, value, onChange, className, disabled }: StateDropdownProps) {
  const [open, setOpen] = useState(false);
  const states = useMemo(() => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode);
  }, [countryCode]);

  const selectedState = useMemo(() => states.find(s => s.isoCode === value), [value, states]);
  
  const isDisabled = disabled || states.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={isDisabled}
        className={cn(
          "flex w-full items-center justify-between h-12 px-4 rounded-xl border border-[#E5E5EA] bg-white text-sm text-[#111111] focus:outline-none focus:border-[#9E9EA7] transition-colors disabled:opacity-50",
          isDisabled && "bg-[#F7F7F8]",
          className
        )}
      >
        <span className="truncate">
          {selectedState ? selectedState.name : (states.length === 0 ? "Select country first..." : "Select state...")}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#6E6E73] opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search state..." 
            onValueChange={() => {
              const el = document.querySelector('[data-slot="command-list"]');
              if (el) el.scrollTop = 0;
            }} 
          />
          <CommandList className="max-h-[200px] scrollbar-thin scrollbar-thumb-[#E5E5EA]">
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {states.map((state) => (
                <CommandItem
                  key={state.isoCode}
                  value={state.name}
                  onSelect={() => {
                    onChange(state.isoCode);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="truncate flex-1">{state.name}</span>
                  {value === state.isoCode && (
                    <Check className="h-4 w-4 text-[#111111] ml-auto shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
