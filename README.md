# 🎓 CBT - Computer Based Test System

Modern Computer Based Test application built with **Next.js 16**, **React 19**, and **Tailwind CSS**.

## ✨ Features

- ✅ **Modern UI Design** - Tailwind CSS with Emerald theme
- ✅ **Dashboard** - Analytics and quick overview
- ✅ **Master Data Management** - Siswa, Guru, Kelas, Jurusan, Mapel
- ✅ **Exam Management** - Create and manage exams
- ✅ **Question Bank** - Store and organize questions
- ✅ **Exam Results** - Track student performance
- ✅ **PDF Export** - Print reports and cards
- ✅ **Responsive Design** - Mobile, tablet, desktop optimized
- ✅ **Authentication** - Secure login system
- ✅ **Database** - MySQL with Prisma ORM

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MySQL 5.7+

### Installation

1. **Install Dependencies**

```bash
npm install
```

2. **Setup Environment Variables**

```bash
cp .env.local.example .env.local
# Edit .env.local with your database credentials
```

3. **Setup Database**

```bash
# Generate Prisma client
npx prisma generate

# Create database and tables
npx prisma migrate dev --name init
```

4. **Run Development Server**

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
nextjs-vscode/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.js            # Home page
│   │   ├── layout.js          # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # UI components (Button, Input, Modal, etc)
│   │   ├── layout/            # Layout components (Sidebar, TopBar)
│   │   └── pages/             # Page components
│   ├── lib/
│   │   └── utils.js           # Utility functions
│   ├── hooks/
│   │   └── index.js           # Custom React hooks
│   ├── api/                   # API routes
│   └── styles/                # Additional styles
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                    # Static files
├── .env.local                 # Environment variables
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
└── next.config.js             # Next.js configuration
```

## 🎨 UI Components

All components are in `src/components/ui/`:

### Form Components

- `Button` - Primary, secondary, danger variants
- `Input` - Text input with validation
- `Select` - Dropdown select
- `TextArea` - Multi-line text input
- `FormGroup` - Multi-column form layout

### Display Components

- `DataTable` - Data table with toolbar
- `Card` - Content card
- `StatCard` - Statistics card
- `Badge` - Status badge

### Dialog Components

- `Modal` - Dialog modal
- `ConfirmDialog` - Confirmation dialog
- `Alert` - Alert message
- `Toast` - Toast notification

### Utility Components

- `LoadingSpinner` - Loading indicator
- `EmptyState` - Empty state display
- `Breadcrumb` - Navigation breadcrumb
- `Pagination` - Pagination controls

## 🔧 Configuration

### Tailwind CSS

Configured in `tailwind.config.js` with:

- Emerald green primary color (#10B981)
- Custom color palette for status (success, warning, danger, info)
- Custom spacing and typography
- Dark mode support

### Prisma Database Schema

11 Models:

- `User` - Authentication
- `Jurusan` - Major/Department
- `Kelas` - Class
- `Siswa` - Student
- `Guru` - Teacher
- `Mapel` - Subject
- `Soal` - Question
- `Ujian` - Exam
- `SoalUjian` - Exam Question
- `HasilUjian` - Exam Result
- `JawabanSiswa` - Student Answer

## 📚 Pages to Build

### Already Prepared:

- ✅ Home page (`/`)
- ✅ Layout with Sidebar & TopBar

### Next to Build:

- [ ] Login page (`/login`)
- [ ] Dashboard (`/dashboard`)
- [ ] Master Data pages (Siswa, Guru, Kelas, Jurusan, Mapel)
- [ ] Exam pages (Bank Soal, Ujian)
- [ ] Results pages (Hasil Ujian, Cetak)

## 🔑 Key Files to Know

| File                             | Purpose           |
| -------------------------------- | ----------------- |
| `src/components/ui/index.js`     | All UI components |
| `src/components/layout/index.js` | Layout components |
| `src/lib/utils.js`               | Utility functions |
| `src/hooks/index.js`             | Custom hooks      |
| `tailwind.config.js`             | Tailwind config   |
| `prisma/schema.prisma`           | Database schema   |

## 🎯 Development Tips

### Using Components

```jsx
import { Button, Input, Modal } from "@/components/ui";
import { DashboardLayout } from "@/components/layout";

export default function Page() {
  return (
    <DashboardLayout>
      <Button variant="primary">Click me</Button>
      <Input label="Name" placeholder="Enter name" />
    </DashboardLayout>
  );
}
```

### Using Custom Hooks

```jsx
import { useApi, useForm } from "@/hooks";

export default function MyPage() {
  const { request, loading } = useApi();

  const { values, handleChange, handleSubmit } = useForm(
    { name: "" },
    async (data) => {
      await request("/api/save", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  );
}
```

### Using Utilities

```jsx
import { formatDate, calculatePercentage, apiRequest } from "@/lib/utils";

const formatted = formatDate(new Date());
const score = calculatePercentage(8, 10); // 80%
const data = await apiRequest("/api/data");
```

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start dev server at localhost:3000

# Production
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint

# Database
npx prisma studio  # Open Prisma Studio
npx prisma migrate dev --name <name>  # Create migration
```

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Prisma Docs](https://www.prisma.io/docs)

## 🐛 Troubleshooting

### Tailwind CSS not working?

1. Ensure `globals.css` imported in `layout.js`
2. Check `tailwind.config.js` content paths
3. Rebuild: `npm run build`

### Database connection error?

1. Check `.env.local` DATABASE_URL
2. Ensure MySQL is running
3. Run `npx prisma db push`

### Components not importing?

1. Check file paths use `@/components/...`
2. Ensure files export components correctly
3. Check imports in `next.config.js`

## 📝 Notes

- All components use `'use client'` directive for client-side features
- CSS is fully Tailwind-based (no custom CSS files)
- Database uses Prisma ORM with MySQL
- Environment variables in `.env.local`

## 📄 License

Private Project - All Rights Reserved

## 👨‍💻 Support

For issues or questions, refer to:

- INSTALLATION_GUIDE.md
- UI_DESIGN_SYSTEM.md
- COMPONENT_LIBRARY.jsx
- EXAMPLE_PAGES.jsx

---

**Created:** June 2, 2026  
**Status:** 🟢 Ready for Development  
**Version:** 1.0.0
