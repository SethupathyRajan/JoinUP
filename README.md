# JoinUP - Student Competition Platform

JoinUP is a comprehensive full-stack web application that enables students to discover, register for, and participate in hackathons and competitions. The platform features gamification, real-time notifications, analytics, and seamless integration with Google Drive for certificate management.

## 🚀 Features

### Core Features
- **Student Registration & Authentication** - Secure registration with @student.tce.edu email validation
- **Competition Management** - Faculty can create, update, and manage hackathons/competitions
- **Team Registration** - Students can register individually or form teams
- **Approval Workflow** - Faculty can approve/reject registrations with feedback
- **Post-Event Submissions** - Upload certificates, project links, and achievements
- **Certificate Management** - Google Drive integration with organized file naming

### Gamification System
- **Points & Levels** - Comprehensive point system with 10+ levels (Newcomer → Hall of Fame)
- **Badges & Achievements** - 4 tiers of badges (Common → Legendary) with 15+ different badges
- **Streaks** - Daily, weekly, and hackathon participation streaks
- **Leaderboards** - Global, department-wise, and category-based rankings
- **Real-time Progress** - Live updates on achievements and level progression

### Additional Features
- **Analytics Dashboard** - Comprehensive platform statistics for faculty
- **Email Notifications** - Automated email alerts using Nodemailer
- **Push Notifications** - Real-time in-app notifications
- **PDF Export** - Generate participation reports and certificates
- **Web Scraping** - (Placeholder) Integration for external competition discovery
- **Responsive Design** - Mobile-friendly interface with JoinUP branding

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Firebase Auth** for authentication
- **React Router** for navigation
- **React Hot Toast** for notifications
- **Framer Motion** for animations
- **Chart.js** for analytics visualization
- **jsPDF** for PDF generation

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Firebase Admin SDK** for authentication
- **Firestore** for database
- **Firebase Storage** for file management
- **Google Drive API** for certificate storage
- **Nodemailer** for email notifications
- **Joi** for input validation
- **Multer** for file uploads
- **PDF-lib** for server-side PDF generation

### Infrastructure
- **Firebase Services** (Auth, Firestore)
- **Google Drive** for organized certificate storage
- **Email SMTP** for notifications
- **Rate Limiting** and security middleware
- **Error Handling** and logging

## 📁 Project Structure

```
JoinUP/
├── src/                          # Frontend source
│   ├── components/              # React components
│   ├── context/                 # React context providers
│   ├── config/                  # Firebase configuration
│   ├── types/                   # TypeScript interfaces
│   └── assets/                  # Static assets (TCE logo)
├── server/                      # Backend source
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Authentication & validation
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Helper functions
│   │   └── models/              # TypeScript interfaces
│   └── config/                  # Server configuration
└── docs/                        # Documentation
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- Google Cloud Platform account (for Drive API)
- SMTP email service

### Frontend Setup

1. **Clone and install dependencies:**
   ```bash
   cd JoinUP
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase configuration in `.env`

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   npm install
   ```


3. **Start development server:**
   ```bash
   npm run dev:full
   ```


### Google Drive API Setup

1. **Enable Drive API:**
   - Go to Google Cloud Console
   - Enable Google Drive API
   - Create service account credentials

2. **Configure Drive Access:**
   - Share target folder with service account email
   - Add credentials to server `.env` file

## 🎮 Gamification Rules

### Points System
- **Registration**: 50 points (75 for team registration)
- **Submissions**: 100 points (on-time), 50 points (late)
- **Competitions**: 500 (1st), 350 (2nd), 250 (3rd), 150 (top 10), 100 (participation)
- **Special**: 200 (recognition), 150 (mentoring), 100 (first-time)
- **Streaks**: 50 (7-day), 200 (30-day), 500 (100-day)

### Levels
1. **Newcomer** (0-499 points)
2. **Explorer** (500-999 points)
3. **Competitor** (1000-1999 points)
4. **Champion** (2000-3499 points)
5. **Expert** (3500-5499 points)
6. **Master** (5500-7999 points)
7. **Legend** (8000-11499 points)
8. **Elite** (11500-15999 points)
9. **Grandmaster** (16000-21999 points)
10. **Hall of Fame** (22000+ points)

### Badge Categories
- **Common**: First Timer, Team Player, Early Bird, Consistent, Solo Warrior
- **Rare**: Hat Trick, Comeback Kid, Mentor, Innovation, Technical Excellence
- **Epic**: Domain Expert, All-Rounder, Speed Demon, Community Leader
- **Legendary**: Champion, Legend, Unstoppable, Master Mentor, Hall of Fame

## 🔐 Security Features

- **Email Domain Validation** - Students: @student.tce.edu, Faculty: @tce.edu
- **Role-based Access Control** - Admin privileges managed via environment variables
- **JWT Token Authentication** - Secure API access with Firebase tokens
- **Input Validation** - Comprehensive validation using Joi schemas
- **Rate Limiting** - Protection against abuse and spam
- **HTTPS Enforcement** - Secure data transmission
- **Password Security** - Strong password requirements and hashing

## 📊 Analytics & Reporting

### Faculty Dashboard
- Total users, competitions, and registrations
- Approval rates and participation trends
- Department and year-wise distribution
- Top performers and leaderboard insights
- Monthly participation statistics

### Student Features
- Personal gamification dashboard
- Participation history with filters
- Achievement tracking and progress
- PDF export of participation records
- Real-time notifications and updates

## 🚧 Future Enhancements

### Planned Features
- **Web Scraping Integration** - Automated discovery of external competitions
- **Advanced Analytics** - Machine learning insights and predictions
- **Mobile App** - Native iOS and Android applications
- **Social Features** - Team formation assistance and networking
- **API Integration** - GitHub, LinkedIn, and portfolio connections
- **Advanced Gamification** - Seasons, tournaments, and special events

### Technical Improvements
- **Microservices Architecture** - Scalable service separation
- **Real-time Chat** - Team communication features
- **Advanced Search** - Elasticsearch integration
- **Caching Layer** - Redis for improved performance
- **CI/CD Pipeline** - Automated testing and deployment
- **Monitoring** - Application performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request


## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🏆 Acknowledgments

- Thiagarajar College of Engineering for project requirements
- Firebase and Google Cloud Platform for infrastructure
- All contributors and testers

---

**JoinUP** - Empowering students to discover, participate, and excel in competitions! 🚀


