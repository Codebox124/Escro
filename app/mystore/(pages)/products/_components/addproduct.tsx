"use client";
import { useState } from "react";
import { Plus, Upload, X, Loader2, AlertCircle } from "@/components/icons";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sellerService } from "@/services/seller";
import { Button } from "@/app/components/ui/Button";
import { useMoney } from "@/app/mystore/_components/currency";
import type { Product } from "./product-card";

interface AddProductProps {
  onProductAdded?: (product: Product) => void;
  children?: React.ReactNode;
  /** Edit mode: pre-fills the form and saves with updateProduct */
  product?: Product;
  onProductUpdated?: (product: Product) => void;
  /** Controlled open state (used by the Edit button) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CATEGORY_OPTIONS = [
  { value: "electronics", label: "Electronics" },
  { value: "wearables", label: "Wearables" },
  { value: "accessories", label: "Accessories" },
  { value: "clothing", label: "Clothing" },
  { value: "home", label: "Home & Living" },
  { value: "sports", label: "Sports & Outdoors" },
];

const errorText = (err: unknown, fallback: string) =>
  (typeof err === "object" && err && "message" in err && String((err as { message: unknown }).message)) ||
  fallback;

interface FormData {
  name: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  image: File | null;
}

interface FormErrors {
  name?: string;
  category?: string;
  price?: string;
  stock?: string;
  description?: string;
  image?: string;
  submit?: string;
}

const AddProduct = ({
  onProductAdded,
  children,
  product,
  onProductUpdated,
  open: controlledOpen,
  onOpenChange,
}: AddProductProps) => {
  const isEdit = !!product;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(value);
    onOpenChange?.(value);
  };
  const [loading, setLoading] = useState(false);
  const existingImage = product?.image || null;
  const [imagePreview, setImagePreview] = useState<string | null>(existingImage);

  const emptyForm: FormData = {
    name: product?.name ?? "",
    category:
      product?.category && product.category !== "Uncategorized" ? product.category.toLowerCase() : "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "",
    description: product?.description ?? "",
    image: null,
  };
  const [formData, setFormData] = useState<FormData>(emptyForm);

  // Keep a product's existing category selectable even if it's not in the default list
  const categoryOptions =
    emptyForm.category && !CATEGORY_OPTIONS.some((c) => c.value === emptyForm.category)
      ? [...CATEGORY_OPTIONS, { value: emptyForm.category, label: product?.category || emptyForm.category }]
      : CATEGORY_OPTIONS;

  const [errors, setErrors] = useState<FormErrors>({});
  const { symbol, currency } = useMoney();

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: "Image size must be less than 10MB",
      }));
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        image: "Please upload a valid image file",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, image: file }));
    setErrors((prev) => ({ ...prev, image: undefined }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove the newly chosen image (in edit mode this goes back to the current image)
  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(existingImage);
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Product name must be at least 3 characters";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!formData.price) {
      newErrors.price = "Price is required";
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!formData.stock) {
      newErrors.stock = "Stock quantity is required";
    } else if (parseInt(formData.stock) < 0) {
      newErrors.stock = "Stock cannot be negative";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("name", formData.name.trim());
      submitData.append("category", formData.category);
      submitData.append("price", formData.price);
      submitData.append("stock", formData.stock);
      submitData.append("description", formData.description.trim());

      if (formData.image) {
        submitData.append("image", formData.image);
      }

      if (isEdit && product) {
        const updated = await sellerService.updateProduct(product.id, submitData);
        onProductUpdated?.(updated);
      } else {
        const newProduct = await sellerService.createProduct(submitData);
        onProductAdded?.(newProduct);
      }

      // Reset form and close dialog
      resetForm();
      setOpen(false);

      // Optional: Show success toast/notification
      // toast.success("Product added successfully!");
    } catch (err) {
      console.error(isEdit ? "Failed to update product:" : "Failed to create product:", err);
      setErrors({
        submit: errorText(
          err,
          isEdit ? "Failed to save changes. Please try again." : "Failed to add product. Please try again."
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(emptyForm);
    setImagePreview(existingImage);
    setErrors({});
  };

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEdit && (
      <DialogTrigger asChild>
        {children || (
          <Button className="h-11 cursor-pointer rounded-full bg-ink pl-1.5 pr-5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus-visible:ring-2 focus-visible:ring-lime-dark/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink"><Plus className="h-4 w-4" /></span>
            Add Product
          </Button>
        )}
      </DialogTrigger>
      )}
      <DialogContent className="w-[calc(100%-1.5rem)] max-h-[90dvh] overflow-y-auto rounded-3xl border-0 bg-white p-5 font-mont shadow-2xl ring-1 ring-black/5 scrollbar-hide sm:max-w-[580px] sm:p-7">
        <DialogHeader className="space-y-1.5 text-left">
          <p className="eyebrow font-space text-emerald-700">{isEdit ? "Edit listing" : "New listing"}</p>
          <DialogTitle className="text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">
            {isEdit ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription className="text-sm text-black/55">
            {isEdit
              ? "Update the details below. Changes show on your storefront right away."
              : "Fill in the product details below to add it to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Global Error */}
          {errors.submit && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-bold text-ink"
            >
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Premium Wireless Headphones"
              className={`h-12 rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                errors.name ? "border-red-500" : ""
              }`}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-xs font-medium text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label
              htmlFor="category"
              className="text-sm font-bold text-ink"
            >
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
              disabled={loading}
            >
              <SelectTrigger
                className={`h-12! w-full rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                  errors.category ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs font-medium text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="price"
                className="text-sm font-bold text-ink"
              >
                Price ({currency.toUpperCase()}) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50 font-medium">
                  {symbol}
                </span>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={`h-12 pl-8 rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                    errors.price ? "border-red-500" : ""
                  }`}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
              {errors.price && (
                <p className="text-xs font-medium text-red-600">{errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="stock"
                className="text-sm font-bold text-ink"
              >
                Stock Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="0"
                className={`h-12 rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
                  errors.stock ? "border-red-500" : ""
                }`}
                min="0"
                disabled={loading}
              />
              {errors.stock && (
                <p className="text-xs font-medium text-red-600">{errors.stock}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-bold text-ink"
            >
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your product in detail..."
              className={`h-28 rounded-2xl border-black/10 bg-white shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-lime-dark/60 resize-none ${
                errors.description ? "border-red-500" : ""
              }`}
              disabled={loading}
            />
            {errors.description && (
              <p className="text-xs font-medium text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-ink">
              Product Image
            </Label>

            {imagePreview ? (
              <div className="relative overflow-hidden rounded-2xl bg-cream p-2">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="h-48 w-full rounded-xl object-cover"
                />
                {formData.image || !isEdit ? (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute right-4 top-4 rounded-full bg-white/95 p-1.5 text-black/70 shadow-md ring-1 ring-black/10 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label={isEdit ? "Keep current image" : "Remove image"}
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <label
                    htmlFor="image-replace"
                    className="absolute right-4 top-4 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-bold text-ink shadow-md ring-1 ring-black/10 transition-colors hover:bg-white"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Replace
                    <input
                      type="file"
                      id="image-replace"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                )}
              </div>
            ) : (
              <div
                className={`rounded-2xl border-2 border-dashed bg-cream/60 p-6 text-center transition-colors sm:p-8 ${
                  errors.image
                    ? "border-red-300 hover:border-red-400"
                    : "border-ink/15 hover:border-ink hover:bg-lime/10"
                }`}
              >
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={loading}
                />
                <label
                  htmlFor="image"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink">
                    <Upload className="w-6 h-6 text-lime" />
                  </div>
                  <div>
                    <span className="font-bold text-ink underline decoration-lime-dark decoration-2 underline-offset-4">
                      Click to upload
                    </span>
                    <span className="text-black/55"> or drag and drop</span>
                  </div>
                  <p className="font-space text-[11px] uppercase tracking-wider text-black/40">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </label>
              </div>
            )}
            {errors.image && (
              <p className="text-xs font-medium text-red-600">{errors.image}</p>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 border-t border-black/5 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-11 rounded-full border-2 border-ink/15 px-6 font-bold text-ink shadow-none hover:border-ink hover:bg-transparent"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 cursor-pointer rounded-full bg-ink px-6 font-bold text-white transition-colors hover:bg-ink-soft"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? "Saving..." : "Adding..."}
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProduct;