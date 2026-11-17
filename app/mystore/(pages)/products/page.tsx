'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { sellerService } from '@/services/seller';
import ProductCard, { type Product } from "./_components/product-card";
import AddProduct from "./_components/addproduct";
import { IconPlus, IconSearch, IconAdjustments, IconRefresh } from "@/components/icons";

const Page = () => {
  const { user, loading: userLoading } = useCurrentUser();

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch seller's products from API
      const data = await sellerService.getProducts({
        search: searchQuery,
        category: filterCategory !== 'all' ? filterCategory : undefined,
      });

      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError((err instanceof Error ? err.message : 'Failed to load products') || 'Failed to load products');

     
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Trigger search when user stops typing (debounce)
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (user) {
        fetchProducts();
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, filterCategory]);

  // Handle product added
  const handleProductAdded = (newProduct: Product) => {
    setProducts([newProduct, ...products]);
  };

  // Handle product updated
  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts(products.map(p =>
      p.id === updatedProduct.id ? updatedProduct : p
    ));
  };

  // Handle product deleted
  const handleProductDeleted = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  // Filter products locally (in addition to API filtering)
  const query = searchQuery.toLowerCase();
  const filteredProducts = products.filter(product => {
    if (!product) return false;
    const name = String(product.name ?? '').toLowerCase();
    const category = String(product.category ?? '').toLowerCase();
    const matchesSearch = name.includes(query) || category.includes(query);
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(p => p?.category).filter(Boolean))];

  // Stats
  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.stock > 0).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10).length;

  // Loading state
  if (userLoading || (loading && products.length === 0)) {
    return (
      <div className="page-container space-y-6 py-6 sm:py-8" aria-busy="true">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-black/10" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded-lg bg-black/[0.07]" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-white ring-1 ring-black/5" />
          ))}
        </div>
        <div className="h-16 animate-pulse rounded-3xl bg-white ring-1 ring-black/5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="surface-card overflow-hidden">
              <div className="aspect-[4/3] animate-pulse bg-cream" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-16 animate-pulse rounded bg-black/10" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-black/10" />
                <div className="h-4 w-full animate-pulse rounded bg-cream" />
                <div className="h-11 w-full animate-pulse rounded-full bg-cream" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statTiles = [
    { label: 'Total Products', value: totalProducts, tone: 'text-ink', dot: 'bg-lime' },
    { label: 'In Stock', value: inStockProducts, tone: 'text-emerald-600', dot: 'bg-emerald-500' },
    { label: 'Low Stock', value: lowStockProducts, tone: 'text-amber-600', dot: 'bg-amber-500' },
    { label: 'Out of Stock', value: outOfStockProducts, tone: 'text-red-600', dot: 'bg-red-500' },
  ];

  return (
    <div className="page-container space-y-6 py-6 sm:py-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow font-space text-emerald-700">Inventory</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
            Products
          </h1>
          <p className="mt-2 text-sm text-black/55 sm:text-base">
            Manage your store inventory and products
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={fetchProducts}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-transparent px-3.5 text-sm font-bold text-ink transition-colors hover:border-ink sm:px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 disabled:opacity-60"
            disabled={loading}
            aria-label="Refresh products"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <AddProduct onProductAdded={handleProductAdded} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {statTiles.map((tile, i) => (
          <div key={tile.label} className={`p-4 sm:p-5 ${i === 0 ? 'rounded-3xl bg-ink text-white' : 'surface-card'}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${tile.dot}`} />
              <p className={`truncate text-xs font-semibold sm:text-sm ${i === 0 ? 'text-white/60' : 'text-black/50'}`}>{tile.label}</p>
            </div>
            <p className={`mt-3 font-space text-2xl font-bold leading-none sm:text-3xl ${i === 0 ? 'text-lime' : tile.tone}`}>{tile.value}</p>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="surface-card p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearch}
              className="h-11 w-full rounded-full border-0 bg-cream/70 pl-10 pr-4 text-sm text-ink ring-1 ring-black/5 placeholder:text-black/40 transition-all focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            className={`inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full border-2 px-3.5 text-sm font-bold transition-colors sm:px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${
              showFilters || filterCategory !== 'all'
                ? 'border-ink bg-ink text-white'
                : 'border-ink/15 bg-transparent text-ink hover:border-ink'
            }`}
          >
            <IconAdjustments className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Category Filters */}
        {showFilters && (
          <div className="mt-3 border-t border-black/5 pt-3">
            <p className="mb-2 eyebrow font-space text-[11px] text-black/45">Category</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60 ${filterCategory === category
                      ? 'bg-lime font-bold text-ink'
                      : 'bg-cream text-black/70 hover:bg-cream-dark'
                    }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50/80 p-4">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              onUpdated={handleProductUpdated}
              onDeleted={handleProductDeleted}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="surface-card px-6 py-12 text-center sm:py-16">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-lime">
            <IconPlus className="h-8 w-8" />
          </div>
          <h3 className="mb-1 text-xl font-extrabold tracking-[-0.02em] text-ink">
            {searchQuery ? 'No products found' : 'No products yet'}
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-black/55">
            {searchQuery
              ? `No products match "${searchQuery}"`
              : 'Get started by adding your first product to your store'
            }
          </p>
          {!searchQuery && (
            <AddProduct onProductAdded={handleProductAdded}>
              <button className="inline-flex h-12 items-center gap-2 rounded-full bg-ink pl-2 pr-6 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark/60">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink"><IconPlus className="h-4 w-4" /></span>
                Add Your First Product
              </button>
            </AddProduct>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;