import React, { useState, useTransition, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Check, ChevronsUpDown, Plus, Loader2, Tag, Box } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
type ClassValue = string | number | boolean | undefined | null;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import type { Brand, Model } from '../../../api/dataconnect/brandModelDataConnectService';
import { fetchBrands, fetchModelsByBrand } from '../../../api/dataconnect/brandModelDataConnectService';

interface BrandModelDropdownProps {
  onBrandChange: (brandId: string, brandName: string) => void;
  onModelChange: (modelId: string, modelName: string, costPrice: number) => void;
  defaultBrandId?: string;
  defaultModelId?: string;
  className?: string;
}

export const BrandModelDropdown: React.FC<BrandModelDropdownProps> = ({
  onBrandChange,
  onModelChange,
  defaultBrandId,
  defaultModelId,
  className,
}) => {
  const [brandOpen, setBrandOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<{ id: string; name: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string; costPrice: number } | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => { loadBrands(); }, []);

  useEffect(() => {
    if (selectedBrand?.id) loadModels(selectedBrand.id);
    else setModels([]);
  }, [selectedBrand?.id]);

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const fetched = await fetchBrands();
      const unique = Array.from(new Map(fetched.map(b => [b.id, b])).values());
      setBrands(unique);
      if (defaultBrandId) {
        const match = unique.find(b => b.id === defaultBrandId);
        if (match) { setSelectedBrand(match); onBrandChange(match.id, match.name); }
      }
    } catch (error) {
      console.error('Failed to load brands:', error);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadModels = async (brandId: string) => {
    setLoadingModels(true);
    try {
      const fetched = await fetchModelsByBrand(brandId);
      const unique = Array.from(new Map(fetched.map(m => [m.id, m])).values());
      setModels(unique);
      if (defaultModelId) {
        const match = unique.find(m => m.id === defaultModelId);
        if (match) {
          setSelectedModel({ id: match.id, name: match.name, costPrice: match.costPrice || 0 });
          onModelChange(match.id, match.name, match.costPrice || 0);
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setBrandOpen(false);
    startTransition(() => onBrandChange(brand.id, brand.name));
  };

  const handleModelSelect = (model: Model) => {
    setSelectedModel({ id: model.id, name: model.name, costPrice: model.costPrice || 0 });
    setModelOpen(false);
    startTransition(() => onModelChange(model.id, model.name, model.costPrice || 0));
  };

  return (
    <div className={cn('space-y-4', className)}>

      {/* ── Brand Dropdown ── */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 shrink-0">
            <Tag className="h-3.5 w-3.5 text-blue-600" />
          </span>
          <span>Brand</span>
          <span className="text-red-500">*</span>
        </label>
        <Popover open={brandOpen} onOpenChange={setBrandOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                'w-full justify-between h-11 px-4 font-normal rounded-xl border border-gray-200 bg-white shadow-sm hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-150',
                selectedBrand ? 'text-gray-900 border-blue-300' : 'text-gray-400'
              )}
              disabled={loadingBrands}
            >
              <span className="truncate text-sm">
                {loadingBrands ? 'Loading brands...' : selectedBrand ? selectedBrand.name : 'Select a brand...'}
              </span>
              {loadingBrands
                ? <Loader2 className="ml-2 h-4 w-4 animate-spin text-gray-300 shrink-0" />
                : <ChevronsUpDown className="ml-2 h-4 w-4 text-gray-300 shrink-0" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 shadow-xl border border-gray-100 rounded-xl overflow-hidden bg-white z-50"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
            align="start"
          >
            <Command>
              <div className="border-b border-gray-100 bg-gray-50/50 px-2">
                <CommandInput placeholder="Search brand..." className="h-10 text-sm bg-transparent border-0" />
              </div>
              <CommandList className="max-h-52 overflow-y-auto py-1.5">
                <CommandEmpty>
                  <div className="py-8 text-center">
                    <div className="text-2xl mb-1">🏷️</div>
                    <div className="text-sm text-gray-400">No brands found</div>
                  </div>
                </CommandEmpty>
                {brands.length > 0 && (
                  <CommandGroup>
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        Available Brands
                      </span>
                    </div>
                    {brands.map((brand) => (
                      <CommandItem
                        key={brand.id}
                        value={brand.name}
                        onSelect={() => handleBrandSelect(brand)}
                        className={cn(
                          'flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors',
                          selectedBrand?.id === brand.id
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          selectedBrand?.id === brand.id ? 'bg-blue-500' : 'bg-gray-200'
                        )} />
                        <span className="flex-1 truncate">{brand.name}</span>
                        {selectedBrand?.id === brand.id && (
                          <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <div className="mx-3 my-1 border-t border-gray-100" />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => setBrandOpen(false)}
                    className="flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-lg text-sm text-blue-500 hover:bg-blue-50/60 cursor-pointer font-medium"
                  >
                    <div className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-blue-100 shrink-0">
                      <Plus className="h-3 w-3 text-blue-600" />
                    </div>
                    <span>Add new brand</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Model Dropdown ── */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-purple-100 shrink-0">
            <Box className="h-3.5 w-3.5 text-purple-600" />
          </span>
          <span>Model</span>
          <span className="text-red-500">*</span>
        </label>
        <Popover open={modelOpen} onOpenChange={setModelOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                'w-full justify-between h-11 px-4 font-normal rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-150',
                !selectedBrand
                  ? 'opacity-60 cursor-not-allowed bg-gray-50'
                  : 'hover:border-purple-400 hover:bg-purple-50/30',
                selectedModel ? 'text-gray-900 border-purple-300' : 'text-gray-400'
              )}
              disabled={!selectedBrand || loadingModels}
            >
              <span className="truncate text-sm">
                {!selectedBrand
                  ? 'Select a brand first'
                  : loadingModels
                  ? 'Loading models...'
                  : selectedModel
                  ? selectedModel.name
                  : 'Select a model...'}
              </span>
              {loadingModels
                ? <Loader2 className="ml-2 h-4 w-4 animate-spin text-gray-300 shrink-0" />
                : <ChevronsUpDown className="ml-2 h-4 w-4 text-gray-300 shrink-0" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 shadow-xl border border-gray-100 rounded-xl overflow-hidden bg-white z-50"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
            align="start"
          >
            <Command>
              <div className="border-b border-gray-100 bg-gray-50/50 px-2">
                <CommandInput placeholder="Search model..." className="h-10 text-sm bg-transparent border-0" />
              </div>
              <CommandList className="max-h-52 overflow-y-auto py-1.5">
                <CommandEmpty>
                  <div className="py-8 text-center">
                    <div className="text-2xl mb-1">📦</div>
                    <div className="text-sm text-gray-400">
                      {selectedBrand ? `No models for ${selectedBrand.name}` : 'Select a brand first'}
                    </div>
                  </div>
                </CommandEmpty>
                {models.length > 0 && (
                  <CommandGroup>
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        Models for {selectedBrand?.name}
                      </span>
                    </div>
                    {models.map((model) => (
                      <CommandItem
                        key={model.id}
                        value={model.name}
                        onSelect={() => handleModelSelect(model)}
                        className={cn(
                          'flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors',
                          selectedModel?.id === model.id
                            ? 'bg-purple-50 text-purple-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          selectedModel?.id === model.id ? 'bg-purple-500' : 'bg-gray-200'
                        )} />
                        <span className="flex-1 truncate">{model.name}</span>
                        {model.costPrice != null && model.costPrice > 0 && (
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                            selectedModel?.id === model.id
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-gray-100 text-gray-500'
                          )}>
                            PKR {model.costPrice.toLocaleString()}
                          </span>
                        )}
                        {selectedModel?.id === model.id && (
                          <Check className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {selectedBrand && (
                  <>
                    <div className="mx-3 my-1 border-t border-gray-100" />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setModelOpen(false)}
                        className="flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-lg text-sm text-purple-500 hover:bg-purple-50/60 cursor-pointer font-medium"
                      >
                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-purple-100 shrink-0">
                          <Plus className="h-3 w-3 text-purple-600" />
                        </div>
                        <span>Add new model for {selectedBrand.name}</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Selection Summary ── */}
      {(selectedBrand || selectedModel) && (
        <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/60 to-purple-50/40 px-4 py-3 space-y-2.5">
          {selectedBrand && (
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 shrink-0">
                <Tag className="h-3.5 w-3.5 text-blue-500" />
              </span>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Brand</span>
              <span className="font-semibold text-gray-800">{selectedBrand.name}</span>
            </div>
          )}
          {selectedModel && (
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-purple-100 shrink-0">
                <Box className="h-3.5 w-3.5 text-purple-500" />
              </span>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Model</span>
              <span className="font-semibold text-gray-800">{selectedModel.name}</span>
              <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-white border border-blue-200 text-blue-600 font-semibold shadow-sm whitespace-nowrap">
                PKR {selectedModel.costPrice?.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};