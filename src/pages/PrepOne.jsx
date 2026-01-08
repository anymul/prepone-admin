import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Menu, 
  X, 
  CheckCircle, 
  BarChart2, 
  BookOpen, 
  Zap, 
  Clock, 
  Star,
  Smartphone,
  ArrowRight,
  Play,
  Shield,
} from 'lucide-react';

/* --- Styles --- */
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  body {
    font-family: 'Inter', sans-serif;
    background-color: #FAFAFA;
    color: #111111;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Premium Card with Colorful Hover */
  .premium-card {
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    transition: all 0.3s ease;
  }
  
  .premium-card:hover {
    border-color: transparent;
    transform: translateY(-5px);
  }

  /* Custom Gradients */
  .bg-gradient-primary { background: linear-gradient(135deg, #3A7AFE 0%, #8B5CF6 100%); }
  .bg-gradient-accent1 { background: linear-gradient(135deg, #F97316 0%, #EC4899 100%); }
  .bg-gradient-dark { background: linear-gradient(to bottom right, #111827, #1e3a8a, #4c1d95); }

  /* Text Gradients */
  .text-gradient-multi {
    background: linear-gradient(to right, #3A7AFE, #8B5CF6, #EC4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Utility to hide scrollbar but allow scrolling */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  /* Solid Nav Background on Scroll */
  .nav-scrolled {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #F3F4F6;
  }
`;

/* --- Components --- */

const PhoneMockup = () => (
  <div className="relative mx-auto border-gray-900 bg-gray-900 border-[12px] rounded-[3rem] h-[550px] w-[300px] shadow-2xl flex flex-col overflow-hidden">
    {/* Side Buttons */}
    <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[15px] top-[72px] rounded-l-lg"></div>
    <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[15px] top-[124px] rounded-l-lg"></div>
    <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[15px] top-[142px] rounded-r-lg"></div>
    
    <div className="rounded-[2.2rem] overflow-hidden w-full h-full bg-[#FAFAFA] relative flex flex-col">
      {/* Status Bar */}
      <div className="h-6 w-full bg-white flex justify-between px-6 items-center pt-2">
        <div className="text-[10px] font-bold">9:41</div>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-black rounded-full text-[8px] text-white flex items-center justify-center"></div>
        </div>
      </div>

      {/* App Content */}
      <div className="p-5 flex flex-col h-full overflow-hidden relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-xs text-gray-500 font-medium">Welcome back,</div>
            <div className="text-lg font-bold text-gray-900">Aman Kumar</div>
          </div>
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full border border-white/50 shadow-sm"></div>
        </div>

        {/* Stats Card - Gradient */}
        <div className="bg-gradient-primary rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-blue-100 text-xs mb-1">Physics Proficiency</div>
              <div className="text-2xl font-bold">87%</div>
            </div>
            <div className="bg-white/20 p-1.5 rounded-lg"><Zap size={16} /></div>
          </div>
          <div className="w-full bg-black/10 h-1.5 rounded-full">
            <div className="bg-white h-1.5 rounded-full w-[87%]"></div>
          </div>
        </div>

        {/* List - Colorful Icons & BGs */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Today's Goals</div>
          {[
            { label: 'Electrostatics Test', icon: <Zap size={14} className="text-orange-600" />, time: '45m', bg: 'bg-orange-100', border: 'border-orange-200' },
            { label: 'Integration PYQ', icon: <BarChart2 size={14} className="text-blue-600" />, time: '30m', bg: 'bg-blue-100', border: 'border-blue-200' },
            { label: 'Chemistry Lab', icon: <BookOpen size={14} className="text-teal-600" />, time: '15m', bg: 'bg-teal-100', border: 'border-teal-200' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center border ${item.border}`}>
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{item.label}</div>
                  <div className="text-[10px] text-gray-400">Adaptive Practice</div>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>

        {/* Floating Action Button - Gradient */}
        <div className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-accent1 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
          <Play size={20} fill="currentColor" />
        </div>
      </div>
    </div>
  </div>
);

const Button = ({ children, variant = 'primary', className, onClick, disabled }) => {
  const base = "px-6 py-3.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm tracking-wide";
  const styles = {
    primary: "bg-gradient-primary text-white hover:shadow-lg hover:shadow-blue-500/30 border border-transparent disabled:opacity-50 disabled:shadow-none",
    secondary: "bg-white text-gray-900 border-2 border-gray-100 hover:border-blue-300 hover:text-blue-600 shadow-sm disabled:opacity-50 disabled:shadow-none",
    accent: "bg-gradient-accent1 text-white hover:shadow-lg hover:shadow-orange-500/30 border border-transparent disabled:opacity-50 disabled:shadow-none",
    // LLM variant removed
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Section = ({ children, className, id }) => (
  <section id={id} className={`py-24 px-6 md:px-12 lg:px-24 max-w-[1400px] mx-auto ${className}`}>
    {children}
  </section>
);

const Badge = ({ children, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
  };
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider mb-6 ${colorClasses[color]}`}>
      <Star size={10} fill="currentColor" />
      {children}
    </div>
  );
};

/* --- Page Sections --- */

const Navbar = ({ setPage, activePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Features', id: 'features' },
    { name: 'Mock Tests', id: 'mock-tests' },
    { name: 'About', id: 'about' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-200 ${scrolled ? 'nav-scrolled py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex justify-between items-center">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setPage('home')}
        >
          <div className="w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">P</div>
          <span className="text-xl font-bold tracking-tight text-gray-900">PrepOne</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setPage(link.id)}
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${activePage === link.id ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}
            >
              {link.name}
            </button>
          ))}
          <Button variant="primary" className="px-5 py-2.5 text-xs">Download App</Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-gray-900" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl p-0 md:hidden block">
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setPage(link.id);
                  setIsOpen(false);
                }}
                className="py-4 px-6 text-left text-gray-800 font-medium border-b border-gray-50 hover:bg-gray-50 hover:text-blue-600"
              >
                {link.name}
              </button>
            ))}
            <div className="p-6">
              <Button variant="primary" className="w-full justify-center">Download App</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const Hero = ({ setPage }) => {
  return (
    <div className="relative pt-32 lg:pt-40 pb-20 overflow-hidden bg-[#FAFAFA]">
      {/* Vibrant Background Blobs */}
      <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-purple-200/40 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4 mix-blend-multiply"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-3xl opacity-60 -translate-x-1/4 translate-y-1/3 mix-blend-multiply"></div>
      <div className="absolute top-1/2 left-1/2 -z-10 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2 mix-blend-multiply"></div>

      <Section className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <div className="space-y-8">
          <Badge color="purple">Bihar Board Science 2026</Badge>
          
          <h1 className="text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-gray-900">
            Prep Earlier. <br/>
            <span className="text-gradient-multi">Prep Better.</span>
          </h1>
          
          <p className="text-xl text-gray-500 max-w-lg leading-relaxed font-light">
            The premium exam companion for Class 12 Science. Master Physics, Chemistry, and Math with adaptive intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button variant="primary">
              <Download size={18} /> Download for Android
            </Button>
            <Button variant="secondary" onClick={() => setPage('features')}>
              Explore Platform
            </Button>
          </div>

          <div className="pt-10 flex items-center gap-4 text-sm font-medium text-gray-400">
            <div className="flex -space-x-2">
               {[1,2,3,4].map(i => (
                 <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br ${i%2===0 ? 'from-blue-300 to-purple-300' : 'from-pink-300 to-orange-300'}`}></div>
               ))}
            </div>
            <span>Trusted by 10,000+ Toppers</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center lg:justify-end">
          {/* Phone */}
          <PhoneMockup />
          
          {/* Floating Static Card - Colorful */}
          <div className="absolute top-[20%] -left-4 lg:left-10 bg-white p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-teal-100 flex items-center gap-4 max-w-[200px] z-20">
            <div className="bg-teal-100 p-2.5 rounded-lg text-teal-700">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-xs text-teal-600 font-semibold uppercase">Daily Streak</p>
              <p className="font-bold text-gray-900">12 Days Active</p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

const Features = () => {
  const features = [
    {
      icon: <Zap size={24} />,
      title: "Adaptive Engine",
      desc: "Questions that evolve. The more you solve, the smarter the algorithm gets, tailoring difficulty to your growth.",
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-600",
      hoverShadow: "hover:shadow-indigo-500/10"
    },
    {
      icon: <Clock size={24} />,
      title: "Real-time Simulation",
      desc: "Experience the exact pressure of the Feb 2026 board exams with strictly timed, pattern-matched mock tests.",
      bgColor: "bg-rose-100",
      textColor: "text-rose-600",
      hoverShadow: "hover:shadow-rose-500/10"
    },
    {
      icon: <BarChart2 size={24} />,
      title: "Precision Analytics",
      desc: "Deep dive into your performance. We identify whether you lost marks due to concepts, speed, or silly errors.",
      bgColor: "bg-cyan-100",
      textColor: "text-cyan-600",
      hoverShadow: "hover:shadow-cyan-500/10"
    }
  ];

  return (
    <div className="bg-white border-y border-gray-100 relative overflow-hidden">
      {/* Subtle background tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent pointer-events-none"></div>
      
      <Section id="features">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">Engineered for Excellence.</h2>
            <p className="text-gray-500 text-lg font-light">We stripped away the clutter to focus on what actually improves your rank.</p>
          </div>
          <Button variant="secondary" className="hidden md:flex">View Full Syllabus <ArrowRight size={16} /></Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className={`premium-card p-8 rounded-2xl group ${f.hoverShadow}`}>
              <div className={`w-14 h-14 rounded-xl ${f.bgColor} ${f.textColor} flex items-center justify-center mb-8 transition-transform group-hover:scale-110`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-gradient-primary transition-colors">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

const MockTestShowcase = () => {
  const mockQuestion = "Two point charges +3µC and -3µC are placed 20cm apart in a vacuum. What is the electric field at the midpoint of the line joining these two charges?";
  // const mockAnswer = '5.4 × 10⁶ N/C'; // Not needed after removing LLM

  // LLM states and functions removed

  return (
    <Section id="mock-test" className="bg-[#FAFAFA]">
      {/* Dark Gradient Background */}
      <div className="bg-gradient-dark rounded-[2.5rem] p-8 md:p-16 text-white overflow-hidden relative shadow-2xl">
        {/* Vibrant Background decorations */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[120px] opacity-40 pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/30 rounded-full blur-[100px] opacity-30 pointer-events-none mix-blend-screen"></div>

        <div className="grid lg:grid-cols-2 gap-16 relative z-10">
          <div>
            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest text-blue-200 mb-8">
              The Exam Interface
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Train like you fight.
            </h2>
            <p className="text-blue-100/80 text-lg mb-10 leading-relaxed max-w-md font-light">
              Our mock test environment mirrors the official Bihar Board CBT interface. Get comfortable with the format before the big day.
            </p>
            
            <div className="space-y-6">
               <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mt-1 shadow-lg shadow-blue-500/50"><CheckCircle size={14} /></div>
                  <div>
                     <h4 className="font-bold text-lg">Instant Explanations</h4>
                     <p className="text-blue-200 text-sm mt-1">Don't just know the answer. Understand the logic.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center mt-1 shadow-lg shadow-pink-500/50"><CheckCircle size={14} /></div>
                  <div>
                     <h4 className="font-bold text-lg">National Benchmarking</h4>
                     <p className="text-blue-200 text-sm mt-1">See where you stand against 50,000+ students.</p>
                  </div>
               </div>
            </div>

            <Button variant="accent" className="mt-12">Start Free Mock Test</Button>
          </div>

          <div className="bg-white rounded-xl overflow-hidden text-gray-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            {/* Mock Test UI Header */}
            <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
              <span className="font-bold text-gray-700">Physics: Full Syllabus Test 04</span>
              <div className="flex items-center gap-2 text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-md">
                 <Clock size={14} />
                 <span className="font-mono font-bold">02:45:12</span>
              </div>
            </div>
            
            {/* Mock Test UI Body */}
            <div className="p-8">
               <div className="flex gap-4 mb-6">
                  <span className="text-gray-400 font-bold">Q.12</span>
                  <p className="font-medium text-lg leading-relaxed">
                     {mockQuestion}
                  </p>
               </div>
               
               <div className="space-y-3 pl-10">
                  {['5.4 × 10⁶ N/C', '2.7 × 10⁶ N/C', '1.8 × 10⁶ N/C', 'Zero'].map((opt, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border flex items-center gap-3 transition-all ${idx === 0 ? 'bg-teal-50 border-teal-500 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                       <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${idx === 0 ? 'border-teal-600 bg-teal-600' : 'border-gray-300'}`}>
                          {idx === 0 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                       </div>
                       <span className={idx === 0 ? 'font-semibold text-teal-900' : 'text-gray-600'}>{opt}</span>
                    </div>
                  ))}
               </div>
               
               <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
                 <Button 
                   variant="secondary" 
                   className="flex-1 justify-center" 
                 >
                   <BookOpen size={18} /> View Detailed Solution
                 </Button>
                 
                 <Button 
                   variant="secondary" 
                   className="flex-1 justify-center" 
                 >
                   <ArrowRight size={18} /> Next Question
                 </Button>
               </div>

               {/* LLM Explanation Display Area removed */}

            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

const Trust = () => (
  <div className="bg-white border-b border-gray-100 py-16 relative overflow-hidden">
     <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-purple-50/50 pointer-events-none"></div>
     <div className="max-w-7xl mx-auto px-6 md:px-12 text-center relative z-10">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Backed by Educators from</p>
        <div className="flex flex-wrap justify-center gap-12 md:gap-24">
           {/* Logos with hover color */}
           {['Patna University', 'Super 30', 'Allen', 'Aakash'].map((name, i) => (
             <h3 key={i} className="text-2xl font-serif font-bold text-gray-300 hover:text-gradient-primary transition-colors cursor-default">{name}</h3>
           ))}
        </div>
     </div>
  </div>
);

const About = () => (
  <Section id="about" className="bg-white relative">
    <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-orange-100/40 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
    <div className="grid md:grid-cols-2 gap-20 items-center">
       <div>
         <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-8 shadow-sm">
            <Shield size={32} />
         </div>
         <h2 className="text-4xl font-bold mb-6 tracking-tight">Focus on the craft. <br/>Not the clutter.</h2>
         <p className="text-gray-500 text-lg leading-relaxed mb-8">
           We built PrepOne because existing apps were too noisy. Too many ads, too many useless features. 
           We stripped it down to the essentials required for the Bihar Board syllabus.
         </p>
         <div className="flex gap-12">
            <div>
               <div className="text-4xl font-bold text-gray-900 mb-1">10k+</div>
               <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">Active Users</div>
            </div>
            <div>
               <div className="text-4xl font-bold text-gray-900 mb-1">500+</div>
               <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">Mock Tests</div>
            </div>
         </div>
       </div>
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4 mt-8">
             <div className="h-48 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-teal-50 opacity-50"></div>
             </div>
             <div className="h-64 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-6 text-white flex flex-col justify-end shadow-lg shadow-orange-500/20">
                <span className="font-bold text-xl">Expert <br/>Faculty</span>
             </div>
          </div>
          <div className="space-y-4">
             <div className="h-64 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex flex-col justify-end shadow-lg shadow-blue-500/20">
                <span className="font-bold text-xl">24/7 <br/>Support</span>
             </div>
             <div className="h-48 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-bl from-purple-50 to-pink-50 opacity-50"></div>
             </div>
          </div>
       </div>
    </div>
  </Section>
);

const Footer = ({ setPage }) => (
  <footer className="bg-[#FAFAFA] pt-24 pb-12 border-t border-gray-200 relative overflow-hidden">
    {/* Colorful footer accent */}
    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-multi"></div>
    
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
      <div className="grid md:grid-cols-12 gap-12 mb-20">
        
        <div className="md:col-span-5">
          <div className="flex items-center gap-2 mb-6 group cursor-pointer">
             <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">P</div>
             <span className="text-xl font-bold text-gray-900">PrepOne</span>
          </div>
          <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
            The definitive preparation platform for Bihar Board Class 12 Science. 
            Meticulously crafted for the serious aspirant.
          </p>
          <div className="flex gap-3">
             <button className="bg-[#111111] text-white px-5 py-3 rounded-lg flex items-center gap-3 hover:bg-gray-900 hover:shadow-lg transition-all">
                <Smartphone size={18} />
                <div className="text-left leading-none">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Download on</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
             </button>
             <button className="bg-white border-2 border-gray-100 text-gray-900 px-5 py-3 rounded-lg flex items-center gap-3 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all">
                <Play size={18} fill="currentColor" />
                <div className="text-left leading-none">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Get it on</div>
                  <div className="text-sm font-bold">Google Play</div>
                </div>
             </button>
          </div>
        </div>

        <div className="md:col-span-2 md:col-start-7">
          <h4 className="font-bold text-gray-900 mb-6">Product</h4>
          <ul className="space-y-4 text-gray-500 text-sm font-medium">
            <li><button onClick={() => setPage('features')} className="hover:text-blue-600 transition-colors">Features</button></li>
            <li><button onClick={() => setPage('mock-tests')} className="hover:text-blue-600 transition-colors">Mock Tests</button></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Success Stories</a></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-bold text-gray-900 mb-6">Company</h4>
          <ul className="space-y-4 text-gray-500 text-sm font-medium">
            <li><button onClick={() => setPage('about')} className="hover:text-blue-600 transition-colors">About</button></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Press</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
          </ul>
        </div>
        
        <div className="md:col-span-2">
          <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
          <ul className="space-y-4 text-gray-500 text-sm font-medium">
            <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Cookies</a></li>
          </ul>
        </div>

      </div>
      
      <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
        <p>&copy; 2025 PrepOne. Made in Bihar, for Bihar.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
           {/* Socials with gradient hover */}
           <div className="w-5 h-5 bg-gray-300 rounded-sm hover:bg-gradient-primary cursor-pointer transition-all"></div>
           <div className="w-5 h-5 bg-gray-300 rounded-sm hover:bg-gradient-primary cursor-pointer transition-all"></div>
           <div className="w-5 h-5 bg-gray-300 rounded-sm hover:bg-gradient-primary cursor-pointer transition-all"></div>
        </div>
      </div>
    </div>
  </footer>
);

/* --- Main App Container --- */

const App = () => {
  const [activePage, setActivePage] = useState('home');

  const renderPage = () => {
    switch(activePage) {
      case 'home':
        return (
          <>
            <Hero setPage={setActivePage} />
            <Trust />
            <Features />
            <MockTestShowcase />
            <About />
          </>
        );
      case 'features': return <><Features /><MockTestShowcase /></>;
      case 'mock-tests': return <MockTestShowcase />;
      case 'about': return <About />;
      default: return <Hero setPage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen relative">
      <style>{customStyles}</style>
      <Navbar setPage={setActivePage} activePage={activePage} />
      
      <main>
        {renderPage()}
      </main>

      <Footer setPage={setActivePage} />
    </div>
  );
};

export default App;