# Zanav - Kennel Management System

<!-- Latest deployment: 2024-12-19 -->

A comprehensive kennel management system built with Next.js, Supabase, and TypeScript.

## ✨ Features

### 🏢 **Multi-Tenant Architecture**

- Separate data isolation for each kennel
- Secure tenant-based access control
- Scalable architecture for multiple kennels

### 📅 **Booking Management**

- Complete booking lifecycle management
- Calendar view with occupancy tracking
- Automated notifications and reminders
- Payment tracking and financial reporting

### 👥 **Client Management**

- Comprehensive client profiles
- Dog information and preferences
- Booking history and preferences
- Communication tools

### 💰 **Financial Management**

- Payment tracking and processing
- Financial reports and analytics
- Revenue tracking by period
- Unpaid booking management

### 🌐 **Public Website Builder**

- **Custom kennel websites** for each tenant
- **Drag-and-drop content management**
- **Image gallery and video support**
- **Customer testimonials and reviews**
- **FAQ management**
- **Contact information and maps**
- **SEO optimization**

### 📱 **Modern UI/UX**

- Responsive design for all devices
- Beautiful, intuitive interface
- Real-time updates and notifications
- Mobile-first approach

### 🔔 **Communication Tools**

- WhatsApp integration
- Email notifications
- SMS capabilities
- Automated reminders

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Database**: PostgreSQL with Row Level Security
- **Deployment**: Vercel
- **Testing**: Vitest
- **Internationalization**: react-i18next

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/Zanav.git
   cd Zanav
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_REMOTE_URL=your_remote_supabase_url
   SUPABASE_REMOTE_SERVICE_ROLE_KEY=your_remote_service_role_key
   ```

4. **Set up Supabase**

   ```bash
   npx supabase start
   npx supabase db reset
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── bookings/          # Booking management
│   ├── clients/           # Client management
│   ├── kennel/            # Public kennel websites
│   ├── settings/          # System settings
│   └── ...
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
├── services/              # Business logic services
└── middleware/            # Authentication middleware
```

## 🌐 Public Website Features

Each kennel gets a beautiful public website with:

- **Hero Section**: Cover photo, title, and tagline
- **Image Gallery**: Showcase your facilities
- **Video Content**: YouTube integration
- **Testimonials**: Customer reviews and ratings
- **FAQ Section**: Common questions and answers
- **Contact Information**: Phone, email, WhatsApp, address
- **Google Maps Integration**: Location display
- **SEO Optimization**: Meta tags and descriptions

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level tenant isolation
- **JWT Authentication**: Secure user sessions
- **Role-based Access Control**: Admin and user permissions
- **Input Validation**: Comprehensive data validation
- **CSRF Protection**: Cross-site request forgery prevention

## 📊 Database Schema

The system uses a comprehensive database schema with:

- **Multi-tenant architecture** with tenant isolation
- **User management** with role-based permissions
- **Booking system** with status tracking
- **Client and dog profiles** with detailed information
- **Payment tracking** with financial reporting
- **Notification system** with templates
- **Website content** management for public sites

## 🚀 Deployment

### Vercel Deployment

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Configure Environment Variables**
   - Add all required environment variables in Vercel dashboard

3. **Deploy**
   - Vercel will automatically deploy on every push to main branch

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_REMOTE_URL=your_remote_storage_url
SUPABASE_REMOTE_SERVICE_ROLE_KEY=your_remote_service_role_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@zanav.io or create an issue in this repository.

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with veterinary systems
- [ ] Advanced payment processing
- [ ] AI-powered booking recommendations
- [ ] Multi-language support expansion

---

**Built with ❤️ for kennel owners worldwide**
