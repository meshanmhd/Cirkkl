"use client";

import { useState, forwardRef, useEffect, useMemo } from "react";
import parsePhoneNumber, { isValidPhoneNumber, AsYouType } from "libphonenumber-js";
import { CircleFlag } from "react-circle-flags";
import { lookup } from "country-data-list";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GlobeIcon, ChevronDown, Check, ChevronsUpDown } from "lucide-react";

import { Country } from "country-state-city";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const phoneSchema = z.string().refine((value) => {
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}, "Invalid phone number");

export type CountryData = {
  alpha2: string;
  alpha3: string;
  countryCallingCodes: string[];
  currencies: string[];
  emoji?: string;
  ioc: string;
  languages: string[];
  name: string;
  status: string;
};

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  onCountryChange?: (data: CountryData | undefined) => void;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  defaultCountry?: string;
  className?: string;
  inline?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      onCountryChange,
      onChange,
      value,
      placeholder,
      defaultCountry = "IN",
      inline = false,
      ...props
    },
    ref
  ) => {
    const [countryData, setCountryData] = useState<CountryData | undefined>();
    const [displayFlag, setDisplayFlag] = useState<string>(defaultCountry.toLowerCase());
    const [hasInitialized, setHasInitialized] = useState(false);
    const [open, setOpen] = useState(false);
    
    const countries = useMemo(() => Country.getAllCountries(), []);

    useEffect(() => {
      if (defaultCountry && !hasInitialized) {
        const newCountryData = lookup.countries({ alpha2: defaultCountry.toUpperCase() })[0] 
          || lookup.countries({ alpha2: defaultCountry.toLowerCase() })[0];
        
        setCountryData(newCountryData);
        setDisplayFlag(defaultCountry.toLowerCase());
        setHasInitialized(true);

        // Auto-fill country code if empty
        if (newCountryData?.countryCallingCodes?.[0] && !value) {
          onChange?.(newCountryData.countryCallingCodes[0] + " ");
        }
      }
    }, [defaultCountry, hasInitialized, value, onChange]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Only allow numbers, plus sign, spaces, and hyphens
      newValue = newValue.replace(/[^\d\s\-\+]/g, '');

      if (!newValue.startsWith("+") && newValue.length > 0 && newValue !== "+") {
        if (newValue.startsWith("00")) {
          newValue = "+" + newValue.slice(2);
        } else if (!newValue.startsWith("0")) {
          // If they typed a number and it doesn't start with +, add the current country's calling code if available
          // Actually, let's just use what they typed, but format it
        }
      }

      onChange?.(newValue);

      try {
        if (newValue === "" || newValue === "+") {
          setDisplayFlag("");
          setCountryData(undefined);
          onCountryChange?.(undefined);
        } else {
          // Use AsYouType for dynamic backspace/typing detection
          const formatter = new AsYouType();
          formatter.input(newValue);
          const countryCode = formatter.getCountry();
          
          if (countryCode) {
            setDisplayFlag(countryCode.toLowerCase());
            const countryInfo = lookup.countries({ alpha2: countryCode })[0];
            if (countryInfo) {
              setCountryData(countryInfo);
              onCountryChange?.(countryInfo);
            }
          }
        }
      } catch (error) {
        // fail silently for partial numbers
      }
    };

    const handleCountrySelect = (isoCode: string) => {
      const countryInfo = lookup.countries({ alpha2: isoCode })[0];
      setDisplayFlag(isoCode.toLowerCase());
      setCountryData(countryInfo);
      onCountryChange?.(countryInfo);
      setOpen(false);

      if (countryInfo && countryInfo.countryCallingCodes && countryInfo.countryCallingCodes.length > 0) {
        const prefix = countryInfo.countryCallingCodes[0];
        // Replace existing prefix or set new one
        if (!value) {
          onChange?.(prefix + " ");
        } else {
          try {
            const parsed = parsePhoneNumber(value, defaultCountry.toUpperCase() as any);
            if (parsed && parsed.nationalNumber) {
              onChange?.(prefix + " " + parsed.nationalNumber);
            } else {
              onChange?.(prefix + " ");
            }
          } catch {
            onChange?.(prefix + " ");
          }
        }
      }
    };

    const inputClasses = cn(
      "flex items-center relative bg-white transition-colors text-base rounded-xl border border-[#E5E5EA] h-12 shadow-none focus-within:border-[#9E9EA7] focus-within:ring-0 disabled:opacity-50 disabled:cursor-not-allowed md:text-sm",
      className
    );

    return (
      <div className={inputClasses}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            type="button"
            className="flex items-center gap-1.5 h-full pl-4 pr-3 border-r border-[#E5E5EA] hover:bg-[#F5F5F7] rounded-l-xl transition-colors focus:outline-none"
          >
            {displayFlag ? (
              <CircleFlag countryCode={displayFlag} height="16" width="16" />
            ) : (
              <GlobeIcon size={16} className="text-[#6E6E73]" />
            )}
            <ChevronsUpDown size={14} className="text-[#6E6E73] opacity-50 ml-0.5" />
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandList className="max-h-[200px] scrollbar-thin scrollbar-thumb-[#E5E5EA]">
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.isoCode}
                      value={country.name}
                      onSelect={() => handleCountrySelect(country.isoCode)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <CircleFlag countryCode={country.isoCode.toLowerCase()} height="16" width="16" />
                      <span className="truncate flex-1">{country.name}</span>
                      {displayFlag.toUpperCase() === country.isoCode && (
                        <Check className="h-4 w-4 text-[#111111] ml-auto shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <input
          ref={ref}
          value={value || ""}
          onChange={handlePhoneChange}
          placeholder={placeholder || "+91 00000 00000"}
          type="tel"
          autoComplete="tel"
          name="phone"
          className="flex-1 w-full bg-transparent border-none text-[14px] text-[#111111] placeholder:text-[#9E9EA7] focus:outline-none focus:ring-0 h-full px-4 rounded-r-xl"
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
