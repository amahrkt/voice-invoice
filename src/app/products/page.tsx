"use client";

/**
 * ProductsPage — halaman manajemen produk (list view + modal form).
 *
 * Menampilkan daftar produk dengan nama, harga (format Rupiah), dan stok.
 * Menyediakan tombol Tambah Produk, Edit, dan Hapus per baris.
 * Modal form tambah/edit dirender sebagai overlay (task 10.2).
 * Konfirmasi hapus akan ditambahkan di task 10.3.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8
 */

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/formatCurrency";
import type { ProductListItem } from "@/types/products";

// ── Form state & errors types ─────────────────────────────────────────────────

interface FormValues {
  nama: string;
  harga: string;
  stok: string;
}

interface FormErrors {
  nama?: string;
  harga?: string;
  stok?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Modal form state ──────────────────────────────────────────────────────

  const [formValues, setFormValues] = useState<FormValues>({ nama: "", harga: "", stok: "" });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Delete confirmation state ─────────────────────────────────────────────

  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Fetch products list on mount ──────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? `HTTP ${res.status}`
        );
      }
      const data: ProductListItem[] = await res.json();
      setProducts(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat daftar produk."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddClick = () => {
    setSelectedProduct(null);
    setFormValues({ nama: "", harga: "", stok: "" });
    setFormErrors({});
    setSubmitError(null);
    setModalMode("add");
  };

  const handleEditClick = (product: ProductListItem) => {
    setSelectedProduct(product);
    setFormValues({
      nama: product.nama,
      harga: String(product.harga),
      stok: String(product.stok),
    });
    setFormErrors({});
    setSubmitError(null);
    setModalMode("edit");
  };

  const handleDeleteClick = (id: string) => {
    setDeleteError(null);
    setDeleteConfirm(id);
  };

  const handleDeleteCancel = () => {
    if (deleteLoading) return;
    setDeleteConfirm(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/products/${deleteConfirm}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setDeleteConfirm(null);
      await fetchProducts();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus produk.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedProduct(null);
    setFormValues({ nama: "", harga: "", stok: "" });
    setFormErrors({});
    setSubmitError(null);
  };

  // ── Client-side validation ────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (formValues.nama.trim() === "") {
      errors.nama = "Nama tidak boleh kosong";
    }

    const hargaNum = Number(formValues.harga);
    if (!Number.isInteger(hargaNum) || hargaNum <= 0) {
      errors.harga = "Harga harus bilangan bulat lebih dari 0";
    }

    const stokNum = Number(formValues.stok);
    if (!Number.isInteger(stokNum) || stokNum < 0) {
      errors.stok = "Stok tidak boleh negatif";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Form submit ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    const payload = {
      nama: formValues.nama.trim(),
      harga: Number(formValues.harga),
      stok: Number(formValues.stok),
    };

    setSubmitting(true);
    try {
      let res: Response;
      if (modalMode === "add") {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // edit mode — selectedProduct must exist
        res = await fetch(`/api/products/${selectedProduct!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? `HTTP ${res.status}`
        );
      }

      // Success: close modal and refresh list
      handleCloseModal();
      await fetchProducts();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Produk
          </h1>
          <button
            type="button"
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-medium transition-all shadow-sm"
            aria-label="Tambah produk baru"
          >
            + Tambah Produk
          </button>
        </div>

        {/* ── Loading spinner ── */}
        {loading && (
          <div
            className="flex justify-center items-center py-20"
            role="status"
            aria-label="Memuat daftar produk"
          >
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Error banner ── */}
        {!loading && error !== null && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          >
            <span className="flex-1 text-sm">{error}</span>
            <button
              type="button"
              onClick={fetchProducts}
              className="shrink-0 text-sm font-medium underline hover:no-underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && error === null && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 dark:text-gray-400">
            <p className="text-base font-medium">Belum ada produk.</p>
            <p className="mt-1 text-sm">Klik &quot;Tambah Produk&quot; untuk menambahkan produk pertama.</p>
          </div>
        )}

        {/* ── Product list ── */}
        {!loading && error === null && products.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama Produk</th>
                  <th className="px-4 py-3 font-semibold text-right">Harga</th>
                  <th className="px-4 py-3 font-semibold text-right">Stok</th>
                  <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {product.nama}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-right tabular-nums">
                      {formatCurrency(product.harga)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-right tabular-nums">
                      {product.stok}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(product)}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
                          aria-label={`Edit produk ${product.nama}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(product.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all"
                          aria-label={`Hapus produk ${product.nama}`}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Delete confirmation modal (task 10.3) ── */}
        {deleteConfirm !== null && (() => {
          const productToDelete = products.find((p) => p.id === deleteConfirm);
          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
              aria-describedby="delete-dialog-desc"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={deleteLoading ? undefined : handleDeleteCancel}
                aria-hidden="true"
              />

              {/* Dialog panel */}
              <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-xl p-6 flex flex-col gap-4">
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>

                {/* Title */}
                <h2
                  id="delete-dialog-title"
                  className="text-center text-lg font-semibold text-gray-900 dark:text-white"
                >
                  Hapus Produk
                </h2>

                {/* Description */}
                <p
                  id="delete-dialog-desc"
                  className="text-center text-sm text-gray-600 dark:text-gray-300"
                >
                  Apakah Anda yakin ingin menghapus produk ini?
                  {productToDelete && (
                    <>
                      {" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        &ldquo;{productToDelete.nama}&rdquo;
                      </span>
                    </>
                  )}
                </p>

                {/* Error message */}
                {deleteError !== null && (
                  <div
                    role="alert"
                    className="text-sm text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
                  >
                    {deleteError}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={handleDeleteCancel}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Batal, jangan hapus produk"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deleteLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    aria-label="Konfirmasi hapus produk"
                  >
                    {deleteLoading ? (
                      <>
                        <span
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                          aria-hidden="true"
                        />
                        Menghapus...
                      </>
                    ) : (
                      "Hapus"
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* ── Add / Edit modal overlay ────────────────────────────────────────── */}
      {modalMode !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={modalMode === "add" ? "Form tambah produk" : "Form edit produk"}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {modalMode === "add" ? "Tambah Produk" : "Edit Produk"}
            </h2>

            <form onSubmit={handleSubmit} noValidate>
              {/* ── Nama field ── */}
              <div className="mb-4">
                <label
                  htmlFor="field-nama"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nama Produk
                </label>
                <input
                  id="field-nama"
                  type="text"
                  value={formValues.nama}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, nama: e.target.value }))
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formErrors.nama
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Contoh: Teh Botol Sosro"
                  aria-describedby={formErrors.nama ? "error-nama" : undefined}
                  aria-invalid={formErrors.nama ? "true" : undefined}
                  disabled={submitting}
                />
                {formErrors.nama && (
                  <p
                    id="error-nama"
                    role="alert"
                    className="mt-1 text-xs text-red-600 dark:text-red-400"
                  >
                    {formErrors.nama}
                  </p>
                )}
              </div>

              {/* ── Harga field ── */}
              <div className="mb-4">
                <label
                  htmlFor="field-harga"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Harga (Rp)
                </label>
                <input
                  id="field-harga"
                  type="number"
                  min="1"
                  step="1"
                  value={formValues.harga}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, harga: e.target.value }))
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formErrors.harga
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Contoh: 5000"
                  aria-describedby={formErrors.harga ? "error-harga" : undefined}
                  aria-invalid={formErrors.harga ? "true" : undefined}
                  disabled={submitting}
                />
                {formErrors.harga && (
                  <p
                    id="error-harga"
                    role="alert"
                    className="mt-1 text-xs text-red-600 dark:text-red-400"
                  >
                    {formErrors.harga}
                  </p>
                )}
              </div>

              {/* ── Stok field ── */}
              <div className="mb-6">
                <label
                  htmlFor="field-stok"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Stok
                </label>
                <input
                  id="field-stok"
                  type="number"
                  min="0"
                  step="1"
                  value={formValues.stok}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, stok: e.target.value }))
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formErrors.stok
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Contoh: 100"
                  aria-describedby={formErrors.stok ? "error-stok" : undefined}
                  aria-invalid={formErrors.stok ? "true" : undefined}
                  disabled={submitting}
                />
                {formErrors.stok && (
                  <p
                    id="error-stok"
                    role="alert"
                    className="mt-1 text-xs text-red-600 dark:text-red-400"
                  >
                    {formErrors.stok}
                  </p>
                )}
              </div>

              {/* ── Submit error ── */}
              {submitError && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
                >
                  {submitError}
                </div>
              )}

              {/* ── Action buttons ── */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Menyimpan..."
                    : modalMode === "add"
                    ? "Tambah"
                    : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
