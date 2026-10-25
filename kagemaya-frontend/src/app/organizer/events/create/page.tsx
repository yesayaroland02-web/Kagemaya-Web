"use client";

import { AlertCircle, ArrowLeft, Calendar, CheckCircle2, Image as ImageIcon, Info, Layers, Loader2, MapPin, Plus, ShieldAlert, Sparkles, TicketPercent, Trash2, Upload } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface TicketTier {
  id: string;
  name: string;
  price: number;
  quota: number;
  benefit?: string;
}

// Fungsi helper untuk mengubah Base64 kembali menjadi File saat form draf dipulihkan
function base64ToFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Categories & cities
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form Fields
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [city, setCity] = useState("Jakarta Selatan");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Banner State
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Multi-Ticket Tiers
  const [tickets, setTickets] = useState<TicketTier[]>([
    {
      id: "tier-1",
      name: "Regular 4D Experience",
      price: 185000,
      quota: 100,
      benefit: "Kursi standar dome 4D + booklet sinema",
    },
    {
      id: "tier-2",
      name: "VIP Curator Experience",
      price: 320000,
      quota: 40,
      benefit: "Baris depan + Q&A privat bersama sutradara Tokyo",
    },
  ]);

  // Submission & feedback state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // Default cities
  const CITIES = ["Jakarta Selatan", "Jakarta Pusat", "Jakarta Barat", "Bandung", "Surabaya", "Yogyakarta", "Bali", "Tokyo (Virtual Live)"];

  // Fetch Categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoadingCategories(true);
        const res = await api.get("/categories");
        if (res.data?.data && Array.isArray(res.data.data)) {
          setCategories(res.data.data);
          if (res.data.data.length > 0) {
            setCategoryId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.warn("Gagal memuat kategori dari API, menggunakan fallback default", err);
        const fallbackCategories: Category[] = [
          { id: "film-4d", name: "Film 4D (Multi-sensory)", slug: "film-4d" },
          { id: "workshop", name: "Workshop Kreatif", slug: "workshop" },
          { id: "talkshow", name: "Talkshow Budaya", slug: "talkshow" },
          { id: "anime-manga", name: "Anime & Manga Exhibition", slug: "anime-manga" },
        ];
        setCategories(fallbackCategories);
        setCategoryId(fallbackCategories[0].id);
      } finally {
        setLoadingCategories(false);
      }

      // Restore Form Draft from LocalStorage if available
      try {
        const savedDraft = localStorage.getItem("kagemaya_event_create_draft");
        if (savedDraft) {
          const d = JSON.parse(savedDraft);
          if (d.title) setTitle(d.title);
          if (d.categoryId) setCategoryId(d.categoryId);
          if (d.city) setCity(d.city);
          if (d.location) setLocation(d.location);
          if (d.description) setDescription(d.description);
          if (d.startDate) setStartDate(d.startDate);
          if (d.endDate) setEndDate(d.endDate);
          if (d.tickets && Array.isArray(d.tickets) && d.tickets.length > 0) {
            setTickets(d.tickets);
          }

          if (d.bannerPreview) {
            setBannerPreview(d.bannerPreview);
            try {
              const restoredFile = base64ToFile(d.bannerPreview, "draft-banner.jpg");
              setBannerFile(restoredFile);
            } catch (err) {
              console.warn("Gagal merekonstruksi file draf:", err);
            }
          }
          setSuccessMessage("Draf formulir Anda sebelumnya berhasil dipulihkan.");
        }
      } catch (e) {
        console.error("Failed to parse saved draft:", e);
      }
    }
    fetchCategories();
  }, []);

  // Handle Image Selection
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ukuran banner maksimal adalah 5 MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Format gambar harus JPG, PNG, atau WEBP.");
      return;
    }

    setErrorMessage(null);
    setBannerFile(file);

    // Konversi ke Base64 agar awet disimpan ke LocalStorage
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Add Ticket Tier
  const handleAddTicket = () => {
    const newId = `tier-${Date.now()}`;
    const nextTierNum = tickets.length + 1;
    setTickets([
      ...tickets,
      {
        id: newId,
        name: `Ticket Tier ${nextTierNum}`,
        price: 150000,
        quota: 50,
        benefit: "",
      },
    ]);
  };

  // Remove Ticket Tier
  const handleRemoveTicket = (id: string) => {
    if (tickets.length <= 1) {
      setErrorMessage("Minimal harus ada 1 jenis tiket untuk event ini.");
      return;
    }
    setTickets(tickets.filter((t) => t.id !== id));
  };

  // Update Ticket Field
  const handleTicketChange = (id: string, field: "name" | "price" | "quota" | "benefit", val: any) => {
    setTickets(
      tickets.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            [field]: field === "price" || field === "quota" ? Number(val) : val,
          };
        }
        return t;
      }),
    );
  };

  // PRD Section 8.4 Invariant Calculation: available_seats = sum(tickets.quota)
  const totalAvailableSeats = tickets.reduce((sum, t) => sum + (Number(t.quota) || 0), 0);

  const minPrice = tickets.length > 0 ? Math.min(...tickets.map((t) => Number(t.price) || 0)) : 0;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validasi Form
    if (!title.trim()) {
      setErrorMessage("Judul event sinematik wajib diisi.");
      return;
    }
    if (!categoryId) {
      setErrorMessage("Kategori event wajib dipilih.");
      return;
    }
    if (!city) {
      setErrorMessage("Kota pelaksanaan wajib dipilih.");
      return;
    }
    if (!location.trim()) {
      setErrorMessage("Lokasi / detail venue wajib diisi.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Sinopsis / deskripsi event wajib diisi.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage("Tanggal mulai dan selesai wajib diisi.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setErrorMessage("Tanggal selesai harus lebih lambat dari tanggal mulai.");
      return;
    }

    if (tickets.length === 0) {
      setErrorMessage("Minimal sertakan 1 jenis tiket.");
      return;
    }

    for (const t of tickets) {
      if (!t.name.trim()) {
        setErrorMessage("Nama jenis tiket tidak boleh kosong.");
        return;
      }
      if (t.quota <= 0) {
        setErrorMessage(`Kuota untuk tiket "${t.name}" harus lebih dari 0.`);
        return;
      }
      if (t.price < 0) {
        setErrorMessage(`Harga untuk tiket "${t.name}" tidak boleh negatif.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("category_id", categoryId);
      formData.append("city", city);
      formData.append("location", location);
      formData.append("description", description);
      formData.append("start_date", start.toISOString());
      formData.append("end_date", end.toISOString());

      // Kirim tickets sebagai JSON string
      const ticketsData = tickets.map((t) => ({
        name: t.name,
        price: Number(t.price),
        quota: Number(t.quota),
      }));
      formData.append("tickets", JSON.stringify(ticketsData));

      if (bannerFile) {
        formData.append("banner", bannerFile);
      }

      const response = await api.post("/events", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newEventId = response.data?.data?.id;
      localStorage.removeItem("kagemaya_event_create_draft");

      if (newEventId) {
        setCreatedEventId(newEventId);
      } else {
        router.push("/organizer/events");
      }
    } catch (err: any) {
      console.error("Error create event:", err);
      const backendMsg = err.response?.data?.message || err.message || "Gagal mempublikasikan event.";
      setErrorMessage(backendMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simpan Draf Formulir ke LocalStorage
  const handleSaveDraft = () => {
    try {
      const draftData = {
        title,
        categoryId,
        city,
        location,
        description,
        startDate,
        endDate,
        tickets,
        bannerPreview, // simpan gambar ke dalam draftData
      };
      localStorage.setItem("kagemaya_event_create_draft", JSON.stringify(draftData));
      setSuccessMessage("Draf event berhasil disimpan di peramban Anda.");
      setTimeout(() => {
        router.push("/organizer/events");
      }, 1000);
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
  };

  // Auth Guard Screen
  if (!authLoading && (!user || user.role !== "ORGANIZER")) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-kage-red/10 border border-kage-red/30 flex items-center justify-center text-kage-red">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-kage-washi mb-3">Akses Khusus Organizer</h1>
        <p className="text-kage-mist max-w-md mx-auto mb-8 text-sm">
          Halaman pembuatan event hanya dapat diakses oleh akun dengan peran <strong>ORGANIZER</strong>.{!user ? " Silakan masuk dengan akun penyelenggara Anda." : " Akun Anda saat ini terdaftar sebagai CUSTOMER."}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/login" className="px-6 py-2.5 rounded bg-kage-red hover:bg-kage-vermilion text-white text-sm font-semibold transition">
            Masuk sebagai Organizer
          </Link>
          <Link href="/events" className="px-6 py-2.5 rounded border border-kage-border hover:border-kage-gold text-kage-mist hover:text-kage-washi text-sm transition">
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name || "Kategori Belum Dipilih";

  return (
    <div className="min-h-screen bg-kage-yoru text-kage-washi py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* TOP BAR / BREADCRUMB */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-kage-border">
          <div className="flex items-center gap-4">
            <Link href="/events" className="p-2 rounded bg-kage-yoru-card border border-kage-border text-kage-mist hover:text-kage-gold hover:border-kage-gold transition" title="Kembali">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-kage-gold font-semibold bg-kage-gold/10 px-2 py-0.5 rounded border border-kage-gold/20">Portal Organizer</span>
                <span className="text-xs text-kage-mist-dim font-serif">影の創造</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-kage-washi mt-1">Buat Event Sinematik Baru</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSaveDraft} className="px-4 py-2 rounded text-xs font-medium border border-kage-border text-kage-mist hover:text-kage-washi hover:bg-kage-yoru-light transition">
              Simpan Draf
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded text-xs font-semibold bg-kage-red hover:bg-kage-vermilion disabled:opacity-50 text-white shadow-md flex items-center gap-2 transition"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? "Menerbitkan..." : "Publikasikan Event"}</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded bg-kage-error/10 border border-kage-error/30 text-kage-error flex items-start gap-3 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 rounded bg-kage-success/10 border border-kage-success/30 text-kage-success flex items-start gap-3 text-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* FORM MAIN GRID */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: FORM SECTIONS */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. INFORMASI DASAR EVENT */}
            <div className="bg-kage-black/60 border border-kage-border rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-kage-border">
                <Sparkles className="w-5 h-5 text-kage-gold" />
                <h2 className="font-serif text-lg font-medium text-kage-washi">1. Informasi Dasar Event</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-kage-mist mb-1.5">
                    Judul Event Sinematik <span className="text-kage-vermilion">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="mis. Yūgen: Film 4D Kolaborasi Tokyo–Jakarta"
                    className="w-full bg-kage-yoru border border-kage-border rounded px-3.5 py-2.5 text-sm text-kage-washi placeholder-kage-mist-dim focus:outline-none focus:border-kage-gold focus:ring-1 focus:ring-kage-gold/20 transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-kage-mist mb-1.5">
                      Kategori <span className="text-kage-vermilion">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disabled={loadingCategories}
                      className="w-full bg-kage-yoru border border-kage-border rounded px-3.5 py-2.5 text-sm text-kage-washi focus:outline-none focus:border-kage-gold transition"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-kage-mist mb-1.5">
                      Kota Pelaksanaan <span className="text-kage-vermilion">*</span>
                    </label>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-kage-yoru border border-kage-border rounded px-3.5 py-2.5 text-sm text-kage-washi focus:outline-none focus:border-kage-gold transition">
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-kage-mist mb-1.5">
                    Lokasi / Detail Venue <span className="text-kage-vermilion">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-kage-mist-dim absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Nama gedung, teater, studio, dan alamat lengkap"
                      className="w-full bg-kage-yoru border border-kage-border rounded pl-10 pr-3.5 py-2.5 text-sm text-kage-washi placeholder-kage-mist-dim focus:outline-none focus:border-kage-gold transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-kage-mist mb-1.5">
                    Sinopsis / Deskripsi Sinematik <span className="text-kage-vermilion">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ceritakan esensi narasi, atmosfer 4D, dan konsep pengalaman karya kepada calon penonton..."
                    className="w-full bg-kage-yoru border border-kage-border rounded px-3.5 py-2.5 text-sm text-kage-washi placeholder-kage-mist-dim focus:outline-none focus:border-kage-gold transition resize-y"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. BANNER POSTER SINEMATIK (16:9) */}
            <div className="bg-kage-black/60 border border-kage-border rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-kage-border">
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-5 h-5 text-kage-gold" />
                  <h2 className="font-serif text-lg font-medium text-kage-washi">2. Banner Poster Sinematik (16:9)</h2>
                </div>
                <span className="text-xs text-kage-mist-dim">Maks. 5 MB (JPG, PNG, WebP)</span>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleBannerChange} accept="image/jpeg,image/png,image/webp" className="hidden" />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-video rounded-lg border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center overflow-hidden group ${
                  bannerPreview ? "border-kage-border hover:border-kage-gold" : "border-kage-border hover:border-kage-gold/60 bg-kage-yoru/50"
                }`}
              >
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-kage-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-kage-washi gap-2">
                      <Upload className="w-6 h-6 text-kage-gold" />
                      <span className="text-xs font-medium">Klik untuk mengganti poster</span>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-kage-yoru border border-kage-border flex items-center justify-center text-kage-gold group-hover:scale-105 transition">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-kage-washi">Unggah Banner Poster Event</p>
                    <p className="text-xs text-kage-mist-dim mt-1">Klik untuk memilih file banner beresolusi 16:9 (Rekomendasi 1920×1080)</p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. JADWAL & WAKTU */}
            <div className="bg-kage-black/60 border border-kage-border rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-kage-border">
                <Calendar className="w-5 h-5 text-kage-gold" />
                <h2 className="font-serif text-lg font-medium text-kage-washi">3. Jadwal & Waktu Pelaksanaan</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-kage-mist mb-1.5">
                    Tanggal & Waktu Mulai <span className="text-kage-vermilion">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-kage-yoru border border-kage-border rounded px-3.5 py-2.5 text-sm text-kage-washi focus:outline-none focus:border-kage-gold transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-kage-mist mb-1.5">
                    Tanggal & Waktu Selesai <span className="text-kage-vermilion">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-kage-yoru border border-kage-border rounded px-3.5 py-2.5 text-sm text-kage-washi focus:outline-none focus:border-kage-gold transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 4. DYNAMIC MULTI-TICKET FORM */}
            <div className="bg-kage-black/60 border border-kage-border rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-kage-border">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-kage-gold" />
                  <h2 className="font-serif text-lg font-medium text-kage-washi">4. Jenis & Kuota Tiket (Tier Management)</h2>
                </div>
                <button type="button" onClick={handleAddTicket} className="px-3 py-1.5 rounded text-xs font-medium border border-kage-border hover:border-kage-gold text-kage-gold hover:bg-kage-gold/10 flex items-center gap-1.5 transition">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Jenis Tiket</span>
                </button>
              </div>

              <div className="space-y-4">
                {tickets.map((ticket, index) => (
                  <div key={ticket.id} className="p-4 rounded border border-kage-border bg-kage-yoru/80 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-kage-yoru-light border border-kage-border text-[11px] font-mono text-kage-gold flex items-center justify-center">{index + 1}</span>
                        <input
                          type="text"
                          value={ticket.name}
                          onChange={(e) => handleTicketChange(ticket.id, "name", e.target.value)}
                          placeholder="Nama Tiket (mis. Regular 4D / VIP)"
                          className="bg-transparent border-b border-dashed border-kage-border focus:border-kage-gold text-sm font-serif font-medium text-kage-washi focus:outline-none px-1 py-0.5"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTicket(ticket.id)}
                        disabled={tickets.length <= 1}
                        title="Hapus jenis tiket"
                        className="text-kage-mist-dim hover:text-kage-vermilion disabled:opacity-30 disabled:hover:text-kage-mist-dim p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-kage-mist-dim mb-1">Harga Satuan (IDR)</label>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={ticket.price}
                          onChange={(e) => handleTicketChange(ticket.id, "price", e.target.value)}
                          className="w-full bg-kage-black border border-kage-border rounded px-3 py-1.5 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-kage-mist-dim mb-1">Kuota Kursi Tiket</label>
                        <input
                          type="number"
                          min={1}
                          value={ticket.quota}
                          onChange={(e) => handleTicketChange(ticket.id, "quota", e.target.value)}
                          className="w-full bg-kage-black border border-kage-border rounded px-3 py-1.5 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-kage-mist-dim mb-1">Benefit Ringkas</label>
                        <input
                          type="text"
                          value={ticket.benefit || ""}
                          onChange={(e) => handleTicketChange(ticket.id, "benefit", e.target.value)}
                          placeholder="mis. Kursi simulator 4D + booklet"
                          className="w-full bg-kage-black border border-kage-border rounded px-3 py-1.5 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* INVARIANT BANNER BOX */}
              <div className="mt-5 p-4 rounded bg-kage-gold/10 border border-kage-gold/30 flex items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-kage-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-kage-washi">Invarian Sistem: Total Kursi Terbuka</p>
                    <p className="text-[11px] text-kage-mist-dim mt-0.5">
                      Kolom <code>Event.available_seats</code> otomatis diakumulasikan dari kuota seluruh jenis tiket.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-serif text-xl font-bold text-kage-gold">{totalAvailableSeats}</span>
                  <span className="text-xs text-kage-mist-dim ml-1">Kursi</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY SUMMARY WIDGET */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-kage-black/80 border border-kage-border rounded-lg p-6 space-y-6 backdrop-blur-md">
              <div className="border-b border-kage-border pb-4">
                <h3 className="font-serif text-base font-semibold text-kage-washi">Ringkasan Publikasi</h3>
                <p className="text-[11px] text-kage-mist-dim mt-0.5">Periksa parameter acara sebelum dipublikasikan ke katalog penonton.</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-kage-mist">Penyelenggara:</span>
                  <span className="font-medium text-kage-washi truncate max-w-[140px]">{user?.name || "Aozora Collective"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-kage-mist">Kategori:</span>
                  <span className="font-medium text-kage-gold truncate max-w-[140px]">{selectedCategoryName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-kage-mist">Kota:</span>
                  <span className="font-medium text-kage-washi">{city}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-kage-mist">Jenis Tiket:</span>
                  <span className="font-medium text-kage-washi">{tickets.length} Tier</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-kage-mist">Total Kapasitas:</span>
                  <span className="font-serif font-bold text-kage-gold text-sm">{totalAvailableSeats} Kursi</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-kage-mist">Harga Mulai Dari:</span>
                  <span className="font-semibold text-kage-vermilion">{formatRupiah(minPrice)}</span>
                </div>

                {startDate && (
                  <div className="flex justify-between items-center border-t border-kage-border pt-3">
                    <span className="text-kage-mist">Mulai:</span>
                    <span className="text-kage-mist text-[11px]">
                      {new Date(startDate).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-kage-border space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-50 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Memproses Event..." : "Publikasikan Event Sekarang"}</span>
                </button>

                <button type="button" onClick={handleSaveDraft} className="w-full py-2 rounded border border-kage-border hover:border-kage-gold text-kage-mist hover:text-kage-washi text-xs font-medium transition">
                  Simpan Draf & Kembali
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* ── MODAL PROMPT: OPSI BUAT VOUCHER SEKARANG ATAU NANTI ── */}
        {createdEventId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-kage-black/80 backdrop-blur-sm">
            <div className="max-w-md w-full bg-kage-yoru border border-kage-gold/40 rounded-xl p-6 shadow-2xl space-y-5 text-center">
              {/* Ikon Sukses Sinematik */}
              <div className="w-14 h-14 mx-auto rounded-full bg-kage-gold/10 border border-kage-gold/30 flex items-center justify-center text-kage-gold">
                <Sparkles className="w-7 h-7" />
              </div>
              {/* Judul & Deskripsi */}
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-semibold text-kage-washi">Event Berhasil Diterbitkan!</h3>
                <p className="text-xs text-kage-mist leading-relaxed">Karya sinematik Anda kini telah aktif. Apakah Anda ingin langsung mendaftarkan voucher promo diskon untuk event ini sekarang?</p>
              </div>
              {/* Tombol Pilihan EO */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {/* Opsi 1: Buat Voucher Sekarang */}
                <button
                  type="button"
                  onClick={() => router.push(`/organizer/events/${createdEventId}/vouchers`)}
                  className="flex-1 py-2.5 px-4 rounded bg-kage-gold hover:bg-yellow-500 text-kage-black text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition"
                >
                  <TicketPercent className="w-4 h-4" />
                  <span>Ya, Buat Voucher</span>
                </button>
                {/* Opsi 2: Nanti Saja */}
                <button
                  type="button"
                  onClick={() => router.push("/organizer/events")}
                  className="flex-1 py-2.5 px-4 rounded border border-kage-border hover:border-kage-washi text-kage-mist hover:text-kage-washi text-xs font-medium transition"
                >
                  <span>Nanti Saja</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
