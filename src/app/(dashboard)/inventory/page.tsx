"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar,
  DollarSign,
  Tag,
  Mic,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VoiceRationAssistantModal } from "@/components/voice/VoiceRationAssistantModal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { GROCERY_CATEGORIES, UNITS, GroceryCategory, UnitType, IInventoryItem } from "@/types";

function InventoryContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");
  const initialStatus = searchParams.get("status") || "all";

  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(initialAction === "new");
  const [editingItem, setEditingItem] = useState<IInventoryItem | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(
    initialAction === "voice" || searchParams.get("voice") === "true"
  );

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "Grains and rice" as GroceryCategory,
    quantity: 1,
    unit: "items" as UnitType,
    packageSize: "",
    minThreshold: 1,
    purchasePrice: "",
    expiryDate: "",
    notes: "",
  });

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory, statusFilter, sortBy, sortOrder]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const res = await fetch(`/api/inventory?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      brand: "",
      category: "Cooking essentials",
      quantity: 1,
      unit: "items",
      packageSize: "",
      minThreshold: 1,
      purchasePrice: "",
      expiryDate: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: IInventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      brand: item.brand || "",
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      packageSize: item.packageSize || "",
      minThreshold: item.minThreshold,
      purchasePrice: item.purchasePrice ? item.purchasePrice.toString() : "",
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split("T")[0] : "",
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name,
        brand: formData.brand || null,
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        packageSize: formData.packageSize || null,
        minThreshold: Number(formData.minThreshold),
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : null,
        expiryDate: formData.expiryDate ? formData.expiryDate : null,
        notes: formData.notes,
      };

      if (editingItem) {
        // PUT update
        const res = await fetch(`/api/inventory/${editingItem._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchInventory();
        }
      } else {
        // POST create
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchInventory();
        }
      }
    } catch (err) {
      console.error("Save item error:", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to remove this item from your household inventory?")) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems(items.filter((i) => i._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickAdjust = async (item: IInventoryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    try {
      const res = await fetch(`/api/inventory/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            Household Inventory
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Track current stock levels, units, expiry dates, and automatic thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex items-center gap-2 text-stone-800 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 font-semibold"
          >
            <Mic className="h-4 w-4 text-emerald-700" />
            Voice Ration Input
          </Button>
          <Button size="md" onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative sm:col-span-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-stone-400" />
            <Input
              type="text"
              placeholder="Search product or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 sm:col-span-2">
            {[
              { id: "all", label: "All Items" },
              { id: "low", label: "Running Low" },
              { id: "critical", label: "Out of Stock" },
              { id: "expired", label: "Expired" },
              { id: "ok", label: "Well Stocked" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === s.id
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-stone-100 text-xs">
          <span className="text-stone-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">
            Category:
          </span>
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedCategory === "All"
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            All
          </button>
          {GROCERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-stone-900 text-white"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table / Grid */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-sm">Loading inventory items...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800">No grocery products found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Add your household essentials manually, or use the AI Grocery Scanner to snap a photo of kitchen items.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button size="sm" onClick={openAddModal}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-semibold border-b border-stone-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Stock & Threshold</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Name & Brand */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900 text-sm">{item.name}</div>
                      <div className="text-[11px] text-stone-400">
                        {item.brand ? item.brand : "Generic / Unbranded"}
                        {item.packageSize && ` • ${item.packageSize}`}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    {/* Quantity & Adjustment */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickAdjust(item, -1)}
                          title="Decrease 1"
                          className="h-6 w-6 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="font-bold text-stone-900 text-sm min-w-10 text-center">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          onClick={() => handleQuickAdjust(item, 1)}
                          title="Increase 1"
                          className="h-6 w-6 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        Alert threshold: {item.minThreshold} {item.unit}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-3">
                      {item.status === "expired" ? (
                        <Badge variant="danger">Expired</Badge>
                      ) : item.status === "critical" ? (
                        <Badge variant="danger">Out of stock</Badge>
                      ) : item.status === "low" ? (
                        <Badge variant="warning">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>

                    {/* Expiry */}
                    <td className="py-3 px-3">
                      {item.expiryDate ? (
                        <div>
                          <div className="font-medium text-stone-700">{formatDate(item.expiryDate)}</div>
                          {typeof item.daysUntilExpiry === "number" && (
                            <div
                              className={`text-[10px] font-semibold ${
                                item.daysUntilExpiry <= 2
                                  ? "text-rose-600"
                                  : item.daysUntilExpiry <= 5
                                  ? "text-amber-600"
                                  : "text-stone-400"
                              }`}
                            >
                              {item.daysUntilExpiry <= 0
                                ? "Already expired"
                                : `${item.daysUntilExpiry} days left`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3">
                      {item.purchasePrice ? (
                        <span className="font-semibold text-stone-800">
                          {formatCurrency(item.purchasePrice)}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          title="Delete Product"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900">
                {editingItem ? "Edit Product" : "Add Grocery Product"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Whole Milk, Olive Oil, Basmati Rice"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Brand (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Organic Valley"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as GroceryCategory })
                    }
                    className="w-full h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {GROCERY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    className="w-full h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Min Threshold *
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={formData.minThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, minThreshold: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Purchase Price ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="3.99"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? "Save Changes" : "Add to Inventory"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Ration Assistant Modal */}
      <VoiceRationAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={fetchInventory}
      />
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-400">Loading inventory...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
