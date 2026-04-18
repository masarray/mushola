# Design System Lock

Single source of truth untuk patch UI PWA Mushola. Fokus: discipline and refinement, bukan redesign total.

## Design Tokens

```ts
export const ui = {
  radius: {
    hero: "30px",
    content: "28px",
    list: "22px",
  },
  spacing: {
    lg: "20px",
    md: "16px",
    sm: "12px",
  },
  cta: {
    primaryHeight: "52px",
    secondaryHeight: "44px",
    chipHeight: "30px",
  },
  shadow: {
    hero: "0 10px 30px rgba(15,23,42,0.12)",
    content: "0 6px 18px rgba(15,23,42,0.08)",
    list: "0 2px 8px rgba(15,23,42,0.05)",
  },
};
```

## Card System

### Hero Card
- Dipakai hanya untuk ringkasan utama screen
- Radius: `30px`
- Padding: `20px`
- Shadow: `hero`
- Border: `1px`, subtle
- Glow: boleh, tapi lokal dan tipis
- Maksimum `1 hero` per screen

### Content Card
- Dipakai untuk section utama di bawah hero
- Radius: `28px`
- Padding: `16px` sampai `20px`
- Shadow: `content`
- Border: `1px`, subtle
- Glow: opsional, tipis

### List Card
- Dipakai untuk item daftar, transaksi, riwayat, shohibul
- Radius: `22px`
- Padding: `14px` sampai `16px`
- Shadow: `list`
- Background lebih flat, dekorasi minimal
- Tidak boleh memakai glow besar

## CTA Hierarchy

### Primary CTA
- Solid brand fill
- Height: `52px`
- Paling dominan dalam satu viewport section
- Dipakai untuk aksi utama kerja / konversi

### Secondary CTA
- Soft fill atau outline
- Height: `44px`
- Untuk aksi pendamping seperti `Salin`, `Lihat Grup`, `Riwayat`

### Tertiary CTA
- Text action atau utility chip
- Tidak boleh background solid
- Untuk aksi minor

### CTA Rules
- Maksimal `1 primary CTA` dalam `1 viewport`
- Secondary tidak boleh lebih kontras dari primary
- Tertiary tidak boleh menggunakan background solid
- Jika ada `2 aksi penting`:
  - `1` harus jadi primary
  - `1` harus diturunkan jadi secondary

## Chip and Segmented Control

### Status Chip
- Height: `30px`
- Compact, konsisten lintas screen
- `Lunas` = hijau lembut
- `DP` / `Dalam Proses` = amber lembut
- `Belum` / `Terdaftar` = netral
- `Kurang` / destructive = merah hemat

### Utility Chip
- Untuk label seperti `Sapi 1`, `Transfer`, `Operasional`
- Netral atau softly tinted
- Tidak boleh lebih kuat dari status chip aktif

### Segmented Control
- Container pill tunggal
- Height target: `40px` sampai `44px`
- Active state = solid/filled
- Inactive state = flat/netral
- Tidak boleh memakai glow besar

## Scanability Rules

- Maksimal `3 informasi utama` per list card
- Status harus terbaca dalam `<1 detik`
- Nilai angka (`Rp`, `%`, `slot`) align kanan jika item berbentuk daftar
- Informasi sekunder diturunkan kontrasnya
- Hindari tinggi card berlebihan tanpa alasan

## Public vs Internal DNA

### Public
- Maksimal `1 hero`
- Maksimal `2 highlight card`
- Whitespace lebih longgar
- Copy pendek dan langsung
- Fokus pada trust, clarity, fast scan

### Internal
- Hero optional
- Density lebih tinggi
- Lebih banyak data per screen
- CTA utama harus terlihat tanpa scroll panjang
- Dekorasi minimal, fokus aksi

## Border, Shadow, Glow

### Border
- Default selalu `1px` dan subtle
- Border dipakai untuk separation, bukan dekorasi utama

### Shadow
- Hero = `hero`
- Content = `content`
- List = `list`
- Tidak boleh improv shadow baru tanpa alasan

### Glow
- Hanya untuk hero, transfer card penting, atau active nav
- Harus lokal dan tipis
- Internal memakai glow lebih hemat daripada public

## Bottom Nav Rules

- Container tetap pill
- Tinggi tetap sekitar `72px + safe area`
- Active item:
  - scale maksimum `1.05`
  - soft background fill
  - glow sangat tipis
- Tidak boleh:
  - lebih kontras dari primary CTA
  - lebih terang dari hero
  - menutupi konten penting

## Larangan

- Jangan campur radius acak di komponen setara
- Jangan pakai glow besar di banyak card dalam satu layar
- Jangan ubah chip style per screen tanpa alasan sistemik
- Jangan membuat lebih dari satu hero per screen
- Jangan mengandalkan hover sebagai affordance utama mobile
- Jangan membuat public screens sepadat internal
- Jangan membuat internal screens sedekoratif public
