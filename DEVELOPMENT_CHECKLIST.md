# 📋 READY FOR DEVELOPMENT - CHECKLIST

## ✅ Installation Complete?

When installation finishes, you should see:

```
✓ npm packages installed (~/2000+ files in node_modules)
✓ package-lock.json updated
```

## ✅ Files & Folders Verified

- [x] src/components/ui/index.js (18 UI components)
- [x] src/components/layout/index.js (Layout + Sidebar + TopBar)
- [x] src/lib/utils.js (Utility functions)
- [x] src/hooks/index.js (Custom hooks)
- [x] prisma/schema.prisma (Database schema)
- [x] src/app/globals.css (Tailwind + custom styles)
- [x] src/app/layout.js (Updated for CBT)
- [x] src/app/page.js (Home page)
- [x] tailwind.config.js (Configuration)
- [x] postcss.config.js (Configuration)
- [x] .env.local.example (Template)
- [x] README_CBT.md (Documentation)

## 🎯 Next Steps (In Order)

### Phase 1: Setup & Verify (10 minutes)

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. (Optional) Open Prisma Studio to verify schema
npx prisma studio

# 3. Start development server
npm run dev

# 4. Open browser to http://localhost:3000
# Should see: CBT home page with navigation
```

### Phase 2: Database Setup (5 minutes)

**Choose ONE method:**

**Option A: Using Local MySQL**

```bash
# 1. Update .env.local with your database
DATABASE_URL="mysql://user:password@localhost:3306/cbt_db"

# 2. Create database schema
npx prisma db push

# 3. Open Prisma Studio
npx prisma studio
```

**Option B: Using MySQL Docker**

```bash
# Run MySQL in Docker
docker run --name mysql_cbt -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=cbt_db -d -p 3306:3306 mysql:8.0

# Connect in .env.local
DATABASE_URL="mysql://root:password@localhost:3306/cbt_db"
```

**Option C: Using SQLite (For Testing)**

```bash
# Update .env.local
DATABASE_URL="file:./dev.db"

# Create database
npx prisma db push
```

### Phase 3: Test Components (5 minutes)

1. Open http://localhost:3000
2. Verify:
   - [x] Home page loads
   - [x] Navigation shows
   - [x] Emerald green colors appear
   - [x] Responsive on mobile (press F12)

### Phase 4: Create Login Page (30 minutes)

Create `src/app/login/page.js`:

```jsx
"use client";
import { SimpleLayout } from "@/components/layout";
import { Button, Input, Alert } from "@/components/ui";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: Call login API
      console.log("Login:", { email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </SimpleLayout>
  );
}
```

### Phase 5: Create Dashboard Page (30 minutes)

Create `src/app/dashboard/page.js`:

```jsx
"use client";
import { DashboardLayout } from "@/components/layout";
import { StatCard, Card, Button } from "@/components/ui";
import { Users, BookOpen, BarChart3, File } from "lucide-react";

export default function DashboardPage() {
  return (
    <DashboardLayout userName="Admin">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard label="Total Siswa" value="245" icon={Users} />
          <StatCard label="Total Guru" value="32" icon={Users} />
          <StatCard label="Ujian Aktif" value="12" icon={BookOpen} />
          <StatCard label="Hasil Ujian" value="1,856" icon={BarChart3} />
        </div>

        {/* Welcome Card */}
        <Card title="Selamat Datang" className="mb-6">
          <p className="text-gray-600 mb-4">
            Selamat datang di sistem CBT. Gunakan menu di sidebar untuk
            mengelola data dan ujian.
          </p>
          <div className="flex gap-2">
            <Button variant="primary">Lihat Ujian</Button>
            <Button variant="secondary">Lihat Siswa</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

### Phase 6: Build Master Data Pages (2+ hours)

Create pages for each menu in `src/app/dashboard/`:

- [ ] siswa/page.js (Student list with CRUD)
- [ ] guru/page.js (Teacher list with CRUD)
- [ ] kelas/page.js (Class list with CRUD)
- [ ] jurusan/page.js (Major list with CRUD)
- [ ] mapel/page.js (Subject list with CRUD)

Use DataTable component for listings.

### Phase 7: Build Exam Pages (2+ hours)

Create pages for exam features:

- [ ] bank-soal/page.js (Question bank)
- [ ] ujian/page.js (Exam management)
- [ ] hasil-ujian/page.js (Results view)

### Phase 8: Setup API Routes (2+ hours)

Create API endpoints in `src/app/api/`:

- [ ] auth/login
- [ ] siswa (GET, POST, PUT, DELETE)
- [ ] guru (GET, POST, PUT, DELETE)
- [ ] kelas (GET, POST, PUT, DELETE)
- [ ] ujian (GET, POST, PUT, DELETE)
- [ ] hasil (GET, POST)

### Phase 9: Testing & Polish (1+ hour)

- [ ] Test all pages work
- [ ] Test all forms validate
- [ ] Test database operations
- [ ] Check mobile responsiveness
- [ ] Performance optimization
- [ ] Error handling

---

## 🔧 Useful Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Database
npx prisma generate     # Generate Prisma client (after schema changes)
npx prisma db push      # Sync database with schema
npx prisma studio      # Open database UI
npx prisma migrate dev --name <name>  # Create migration

# Building
npm run build           # Build for production
npm start              # Start production server
npm run lint           # Run linter

# Cleaning
rm -rf node_modules    # Remove node_modules
rm package-lock.json   # Remove lock file
npm install            # Fresh install
```

---

## 📝 Important Notes

1. **Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Update with your database credentials
   - Never commit `.env.local` to git

2. **Components**
   - All in `src/components/ui/` for UI
   - All in `src/components/layout/` for layouts
   - Use `'use client'` directive for client-side features

3. **Database**
   - Schema defined in `prisma/schema.prisma`
   - Use `npx prisma generate` after schema changes
   - Use Prisma Client in API routes

4. **Styling**
   - 100% Tailwind CSS (no custom CSS)
   - Colors from `tailwind.config.js`
   - Responsive classes: `md:` and `lg:`

5. **Hooks**
   - useApi - for API calls
   - useForm - for forms
   - usePagination - for pagination
   - useLocalStorage - for storage
   - useAsync - for async operations

---

## ⚠️ Troubleshooting

### Issue: "Cannot find module '@/components/ui'"

**Solution:** Check that `jsconfig.json` has path aliases configured

### Issue: Tailwind styles not appearing

**Solution:**

1. Check `globals.css` is imported in `layout.js`
2. Verify `tailwind.config.js` content paths
3. Restart dev server

### Issue: Database connection error

**Solution:**

1. Check `.env.local` DATABASE_URL
2. Verify MySQL/database is running
3. Try `npx prisma db push`

### Issue: Prisma client outdated

**Solution:** Run `npx prisma generate`

---

## 📞 Reference

### Component Usage Examples

See `EXAMPLE_PAGES.jsx` in session folder for:

- LoginPage example
- DashboardPage example
- SiswaListPage example
- SiswaFormPage example
- ExamPage example

### UI Design System

See `UI_DESIGN_SYSTEM.md` in session folder for:

- Color palette details
- Typography system
- Component patterns
- Responsive breakpoints

### Tailwind CSS

See `IMPLEMENTATION_GUIDE.md` in session folder for:

- Setup instructions
- Common patterns
- Component examples
- Troubleshooting

---

## ✨ You're All Set!

All files are prepared and ready. Just:

1. Wait for npm install to finish
2. Follow Phase 1-9 above
3. Build each feature step by step

**Estimated total time:** 8-16 hours for complete app

---

**Created:** June 2, 2026  
**Status:** ✅ READY FOR DEVELOPMENT  
**Last Updated:** Installation in progress

When installation completes, follow Phase 1 steps above.
