# 🚀 QUICK REFERENCE CARD

## ✅ INSTALLATION STATUS

**npm install:** Running in terminal...

## 📂 Files Prepared (While You Wait)

```
nextjs-vscode/
├── tailwind.config.js          ✅ Configured
├── postcss.config.js           ✅ Configured
├── .env.local.example          ✅ Ready
├── README_CBT.md               ✅ Documentation
├── PREPARATION_SUMMARY.md      ✅ What was done
├── DEVELOPMENT_CHECKLIST.md    ✅ Next steps
├── src/
│   ├── app/
│   │   ├── layout.js           ✅ CBT setup
│   │   ├── page.js             ✅ Home page
│   │   └── globals.css         ✅ Tailwind ready
│   ├── components/
│   │   ├── ui/index.js         ✅ 18 components
│   │   └── layout/index.js     ✅ Layouts ready
│   ├── lib/utils.js            ✅ Utilities ready
│   ├── hooks/index.js          ✅ Hooks ready
│   └── api/                    ✅ Folder ready
└── prisma/
    └── schema.prisma           ✅ Database ready
```

## 🎯 What to Do When Installation Finishes

```bash
# Step 1: Generate database client
npx prisma generate

# Step 2: Setup your database (MySQL, SQLite, PostgreSQL)
# Edit .env.local with DATABASE_URL, then:
npx prisma db push

# Step 3: Start development
npm run dev
# Visit http://localhost:3000
```

## 🎨 Use Components Like This

```jsx
"use client";
import { DashboardLayout } from "@/components/layout";
import { Button, Input, DataTable, Alert } from "@/components/ui";

export default function Page() {
  return (
    <DashboardLayout userName="Admin">
      <Button variant="primary">Click me</Button>
      <Input label="Name" placeholder="Enter name" />
    </DashboardLayout>
  );
}
```

## 📦 Available Components

**Form:** Button, Input, Select, TextArea, FormGroup
**Display:** DataTable, Card, StatCard, Badge
**Dialog:** Modal, ConfirmDialog, Alert
**Utility:** LoadingSpinner, EmptyState, Breadcrumb, Pagination
**Layout:** Sidebar, TopBar, DashboardLayout, SimpleLayout

## 🔧 Available Hooks

```jsx
import {
  useApi,
  useForm,
  usePagination,
  useLocalStorage,
  useAsync,
} from "@/hooks";

// useApi - Make API calls
const { request, loading, error } = useApi();
const data = await request("/api/data");

// useForm - Form state management
const { values, handleChange, handleSubmit } = useForm(
  { email: "" },
  async (data) => {
    /* submit */
  },
);

// usePagination - Pagination
const { currentPage, currentItems, nextPage } = usePagination(items, 10);
```

## 🎨 Colors & Styling

```jsx
// Emerald green theme
Primary:   #10b981 (emerald-500)
Hover:     #059669 (emerald-600)
Active:    #047857 (emerald-700)

Success:   #10b981
Warning:   #f59e0b
Danger:    #ef4444
Info:      #3b82f6
```

## 📝 Key Files to Know

| File                             | Purpose           |
| -------------------------------- | ----------------- |
| `src/components/ui/index.js`     | All UI components |
| `src/components/layout/index.js` | Layout components |
| `src/lib/utils.js`               | Utility functions |
| `src/hooks/index.js`             | Custom hooks      |
| `tailwind.config.js`             | Tailwind config   |
| `prisma/schema.prisma`           | Database schema   |

## 🎯 10 Menus to Build

1. Dashboard → `/dashboard`
2. Siswa → `/dashboard/siswa`
3. Guru → `/dashboard/guru`
4. Kelas → `/dashboard/kelas`
5. Jurusan → `/dashboard/jurusan`
6. Mapel → `/dashboard/mapel`
7. Bank Soal → `/dashboard/bank-soal`
8. Ujian → `/dashboard/ujian`
9. Hasil Ujian → `/dashboard/hasil-ujian`
10. Cetak Kartu → `/dashboard/cetak-kartu`

## 💾 Useful Commands

```bash
npm run dev                    # Start dev server
npm run build                  # Build for production
npm start                      # Run production
npm run lint                   # Run linter

npx prisma generate           # Generate client
npx prisma db push            # Sync database
npx prisma studio             # Open database UI
npx prisma migrate dev        # Create migration
```

## ⚡ Quick Start Pages (Templates)

### Login Page

```jsx
"use client";
import { SimpleLayout } from "@/components/layout";
import { Input, Button, Alert } from "@/components/ui";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // TODO: Call API
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <SimpleLayout title="LOGIN">
      {error && <Alert type="error" message={error} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="primary" className="w-full">
          Login
        </Button>
      </form>
    </SimpleLayout>
  );
}
```

### List Page

```jsx
"use client";
import { DashboardLayout } from "@/components/layout";
import { DataTable, Button } from "@/components/ui";
import { useState } from "react";

export default function SiswaPage() {
  const [data] = useState([{ id: 1, nis: "001", nama: "Budi" }]);

  return (
    <DashboardLayout>
      <DataTable
        title="Data Siswa"
        columns={[
          { key: "nis", label: "NIS" },
          { key: "nama", label: "Nama" },
          {
            key: "id",
            label: "Aksi",
            render: (row) => <Button size="sm">Edit</Button>,
          },
        ]}
        data={data}
        onAdd={() => alert("Add new")}
      />
    </DashboardLayout>
  );
}
```

## 📞 Need Help?

Check these files:

- `README_CBT.md` - Project overview
- `DEVELOPMENT_CHECKLIST.md` - Step-by-step guide
- `PREPARATION_SUMMARY.md` - What was created
- Session folder - Example pages and design system

## 📊 Project Stats

- 18 UI Components
- 4 Layout Components
- 13 Utility Functions
- 5 Custom Hooks
- 11 Database Models
- 19 npm Packages
- 100% Tailwind CSS

## ✨ You're Ready!

Once npm finishes:

1. `npx prisma generate`
2. `npx prisma db push`
3. `npm run dev`
4. Open http://localhost:3000
5. Start building!

---

**Created:** June 2, 2026 | **Status:** ✅ Ready for Development
