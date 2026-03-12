import React, { useState, useTransition, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Badge } from '../../../components/ui/badge';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
type ClassValue = string | number | boolean | undefined | null;

// cn utility - Tailwind class merge
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import type { Brand, Model } from '../../../api/dataconnect/brandModelDataConnectService';
import { fetchBrands, createBrand, fetchModelsByBrand, createModel } from '../../../api/dataconnect/brandModelDataConnectService';


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
  className
}) => {
  const [open, setOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<{ id: string; name: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string; costPrice: number } | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load initial data
  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand?.id) {
      loadModels(selectedBrand.id);
    }
  }, [selectedBrand?.id]);

  const loadBrands = async () => {
  setLoading(true);
  try {
    console.log('🔍 FETCHING BRANDS...');
    const fetchedBrands = await fetchBrands();
    console.log('📦 FETCHED BRANDS:', fetchedBrands.length, 'brands');
    fetchedBrands.forEach(b => console.log('-', b.name, b.id));
    setBrands(fetchedBrands);
    
    // Set default brand
    if (defaultBrandId) {
      console.log('🎯 PREFILL BRAND ID:', defaultBrandId);
      const defaultBrand = fetchedBrands.find((b: Brand) => b.id === defaultBrandId);
      console.log('MATCHED BRAND:', defaultBrand);
      if (defaultBrand) {
        setSelectedBrand(defaultBrand);
        onBrandChange(defaultBrand.id, defaultBrand.name);
      } else {
        console.log('⚠️ NO MATCH - BRANDS:', fetchedBrands.map(b => b.id));
      }
    }
  } catch (error) {
    console.error('❌ FAILED to load brands:', error);
  } finally {
    setLoading(false);
  }
  };

  const loadModels = async (brandId: string) => {
    try {
      const fetchedModels = await fetchModelsByBrand(brandId);
      setModels(fetchedModels);
      
      // Set default model
      if (defaultModelId) {
        const defaultModel = fetchedModels.find((m: Model) => m.id === defaultModelId);
        if (defaultModel) {
          setSelectedModel({
            id: defaultModel.id,
            name: defaultModel.name,
            costPrice: defaultModel.costPrice || 0
          });
          onModelChange(defaultModel.id, defaultModel.name, defaultModel.costPrice || 0);
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setOpen(false);
    onBrandChange(brand.id, brand.name);
  };

  const handleModelSelect = (model: Model) => {
    setSelectedModel({
      id: model.id,
      name: model.name,
      costPrice: model.costPrice || 0
    });
    setOpen(false);
    onModelChange(model.id, model.name, model.costPrice || 0);
  };

  const addNewBrand = async () => {
    const newBrandName = prompt('Enter new brand name:');
    if (newBrandName && newBrandName.trim()) {
      startTransition(async () => {
        const newBrand = await createBrand({ name: newBrandName.trim() });
        if (newBrand) {
          await loadBrands();
          handleBrandSelect(newBrand);
        }
      });
    }
  };

  const addNewModel = async () => {
    if (!selectedBrand) return;
    
    const newModelName = prompt('Enter new model name:');
    const newCostPrice = prompt('Enter cost price (PKR):');
    
    if (newModelName && newCostPrice && selectedBrand) {
      startTransition(async () => {
        const costPriceNum = parseFloat(newCostPrice);
        const newModel = await createModel({
          name: newModelName.trim(),
          brandId: selectedBrand.id,
          costPrice: isNaN(costPriceNum) ? 0 : costPriceNum
        });
        if (newModel) {
          await loadModels(selectedBrand.id);
          handleModelSelect(newModel);
        }
      });
    }
  };

  return (
    <div className={cn("grid gap-4", className)}>
      {/* Brand Dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">Brand *</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between capitalize"
              disabled={loading}
            >
              {selectedBrand ? selectedBrand.name : "Select brand..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search brand..." />
              <CommandEmpty>No brand found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {brands.map((brand) => (
                    <CommandItem
                      key={brand.id}
                      value={brand.name}
                      onSelect={() => handleBrandSelect(brand)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedBrand?.id === brand.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {brand.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup>
                  <CommandItem
                    onSelect={addNewBrand}
                    className="justify-start text-muted-foreground cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new brand
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Model Dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">Model *</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between capitalize"
              disabled={!selectedBrand || loading || isPending}
            >
              {selectedModel ? `${selectedModel.name} (PKR ${selectedModel.costPrice?.toLocaleString()})` : "Select model..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search model..." />
              <CommandEmpty>No model found. {selectedBrand && 'Select a brand first.'}</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {models.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.name}
                      onSelect={() => handleModelSelect(model)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedModel?.id === model.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {model.name}
                      {model.costPrice && (
                        <Badge variant="secondary" className="ml-auto">
                          PKR {model.costPrice.toLocaleString()}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {selectedBrand && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={addNewModel}
                      className="justify-start text-muted-foreground cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add new model for {selectedBrand.name}
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Info */}
      <div className="space-y-1 text-sm text-gray-600">
        {selectedBrand && (
          <div>
            Brand: <span className="font-medium">{selectedBrand.name}</span>
          </div>
        )}
        {selectedModel && (
          <div>
            Model: <span className="font-medium">{selectedModel.name}</span>{' '}
            <Badge variant="outline" className="ml-2">
              Cost: PKR {selectedModel.costPrice?.toLocaleString()}
            </Badge>
          </div>
        )}
        {loading && <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>}
      </div>
    </div>
  );
};

