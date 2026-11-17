"use client";
import { useState } from "react";
import { Edit, Trash2, Package, AlertCircle } from "@/components/icons";
import { Button } from "@/app/components/ui/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { sellerService } from "@/services/seller";
import AddProduct from "./addproduct";
import { useMoney } from "@/app/mystore/_components/currency";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image?: string;
};

interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image?: string;
  onUpdated?: (product: Product) => void;
  onDeleted?: (productId: string) => void;
}

const ProductCard = ({
  id,
  name,
  category,
  price,
  stock,
  description,
  image,
  onUpdated,
  onDeleted,
}: ProductCardProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { format } = useMoney();
  // Get stock status
  const getStockStatus = () => {
    if (stock === 0) {
      return {
        label: "Out of Stock",
        color: "bg-red-100 text-red-700 ring-red-600/10",
        dotColor: "bg-red-500",
      };
    } else if (stock <= 10) {
      return {
        label: "Low Stock",
        color: "bg-amber-100 text-amber-700 ring-amber-600/10",
        dotColor: "bg-amber-500",
      };
    } else {
      return {
        label: "In Stock",
        color: "bg-emerald-100 text-emerald-700 ring-emerald-600/10",
        dotColor: "bg-emerald-500",
      };
    }
  };

  const stockStatus = getStockStatus();

  // Handle delete
  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await sellerService.deleteProduct(id);
      if (onDeleted) {
        onDeleted(id);
      }
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete product"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="surface-card card-hover group flex flex-col overflow-hidden">
        {/* Product Image */}
        <div className="relative m-2 aspect-[4/3] overflow-hidden rounded-[20px] bg-cream">
          {image ? (
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-cream">
              <Package className="h-14 w-14 text-ink/20" strokeWidth={1.5} />
            </div>
          )}

          {/* Stock Badge */}
          <div className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset backdrop-blur ${stockStatus.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${stockStatus.dotColor}`}></span>
            {stockStatus.label}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
          {/* Category */}
          <span className="inline-flex w-fit rounded-full bg-cream px-2.5 py-1 font-space text-[10px] uppercase tracking-widest text-black/55">
            {category}
          </span>

          {/* Name */}
          <h3 className="mt-2.5 line-clamp-1 text-lg font-extrabold tracking-[-0.02em] text-ink">
            {name}
          </h3>

          {/* Description */}
          <p className="mt-1 line-clamp-2 text-sm text-black/55">
            {description}
          </p>

          {/* Price and Stock */}
          <div className="mt-4 flex items-end justify-between rounded-2xl bg-cream px-4 py-3">
            <div>
              <p className="eyebrow font-space text-[10px] text-black/45">Price</p>
              <p className="mt-0.5 font-space text-xl font-bold text-ink">
                {format(price)}
              </p>
            </div>
            <div className="text-right">
              <p className="eyebrow font-space text-[10px] text-black/45">Stock</p>
              <p className={`mt-0.5 font-space text-xl font-bold ${stock === 0 ? 'text-red-600' :
                  stock <= 10 ? 'text-amber-600' :
                    'text-emerald-600'
                }`}>
                {stock}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-full border-2 border-ink/15 bg-transparent font-bold text-ink shadow-none hover:border-ink hover:bg-transparent hover:text-ink"
              onClick={() => setEditOpen(true)}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-full border-2 border-red-200 bg-transparent font-bold text-red-600 shadow-none hover:border-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] rounded-3xl border-0 p-6 font-mont ring-1 ring-black/5 sm:p-7">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-extrabold tracking-[-0.03em] text-ink">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-black/55">
              Are you sure you want to delete &quot;{name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="h-11 rounded-full border-2 border-ink/15 px-6 font-bold text-ink shadow-none hover:border-ink hover:bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="h-11 rounded-full bg-red-600 px-6 font-bold text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog — mounted only while open so it pre-fills from the latest data */}
      {editOpen && (
        <AddProduct
          product={{ id, name, category, price, stock, description, image }}
          open={editOpen}
          onOpenChange={setEditOpen}
          onProductUpdated={(updated) => onUpdated?.(updated)}
        />
      )}
    </>
  );
};

export default ProductCard;