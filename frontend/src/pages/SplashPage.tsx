// Lerato Sibanda u22705504 P14
import * as React from 'react';
const { useState, useEffect } = React;
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { authApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export const SplashPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();
  
  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const response = await authApi.login({
          email: formData.email,
          password: formData.password,
        });
        
        if (response.success && response.user) {
          // Store session ID in localStorage
          localStorage.setItem('sessionId', response.user._id);
          login(response.user);
          navigate('/home');
        } else {
          setError(response.message || 'Login failed');
        }
      } else {
        const response = await authApi.register({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        
        if (response.success && response.user) {
          // Store session ID in localStorage
          localStorage.setItem('sessionId', response.user._id);
          login(response.user);
          navigate('/home');
        } else {
          setError(response.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Animated Background Layers */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Layer 1 - Deepest background */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
        
        {/* Layer 2 - Floating shapes */}
        <div 
          className="absolute inset-0"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        </div>
        
        {/* Layer 3 - Grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            transform: `translateY(${scrollY * 0.2}px)`,
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center p-4">
          <div 
            className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          >
            {/* Left Side - Branding */}
            <div className="text-white space-y-6">
              <div 
                className="transform transition-all duration-1000"
                style={{ 
                  opacity: Math.max(0, 1 - scrollY / 500),
                  transform: `translateX(${-scrollY * 0.2}px) scale(${Math.max(0.8, 1 - scrollY / 1000)})`
                }}
              >
                <h1 className="text-6xl md:text-7xl font-bold mb-4 animate-fade-in">
                  Collab<span className="text-yellow-300">Code</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 animate-fade-in-delay-1">
                  Version control made simple. Collaborate, create, and code together.
                </p>
              </div>
              
              <div className="space-y-4 animate-fade-in-delay-2">
                {[
                  { icon: '🚀', text: 'Share and manage code projects' },
                  { icon: '🔄', text: 'Check-in and check-out system' },
                  { icon: '👥', text: 'Collaborate with friends and teams' },
                  { icon: '💬', text: 'Real-time discussions' },
                  { icon: '📁', text: 'Organized file management' }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 transform transition-all duration-500"
                    style={{ 
                      opacity: Math.max(0, 1 - scrollY / 600),
                      transform: `translateX(${-scrollY * 0.1}px)`,
                      transitionDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl">
                      {feature.icon}
                    </div>
                    <p className="text-lg">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Side - Auth Forms */}
            <div 
              className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white border-opacity-20"
              style={{ 
                transform: `translateY(${scrollY * 0.1}px)`,
                opacity: Math.max(0.3, 1 - scrollY / 800)
              }}
            >
              <div className="flex gap-4 mb-6">
                <button
                  className={`flex-1 py-2 font-medium rounded-lg transition-all ${
                    isLogin
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                  }`}
                  onClick={() => setIsLogin(true)}
                >
                  Log In
                </button>
                <button
                  className={`flex-1 py-2 font-medium rounded-lg transition-all ${
                    !isLogin
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                  }`}
                  onClick={() => setIsLogin(false)}
                >
                  Register
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-white mb-1">
                        Full Name
                      </label>
                      <input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-white border-opacity-30 rounded-lg bg-white bg-opacity-90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-white mb-1">
                        Username
                      </label>
                      <input
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-white border-opacity-30 rounded-lg bg-white bg-opacity-90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                      />
                    </div>
                  </>
                )}
                
                <div className="w-full">
                  <label className="block text-sm font-medium text-white mb-1">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-white border-opacity-30 rounded-lg bg-white bg-opacity-90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
                
                <div className="w-full">
                  <label className="block text-sm font-medium text-white mb-1">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-white border-opacity-30 rounded-lg bg-white bg-opacity-90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Sections for Parallax Effect */}
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-10"
            style={{ 
              transform: `translateY(${scrollY * 0.3}px) rotate(45deg) scale(1.5)`,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 51px)'
            }}
          />
          <div 
            className="max-w-4xl text-center text-white z-10"
            style={{ transform: `translateY(${(scrollY - 600) * 0.2}px)` }}
          >
            <h2 className="text-5xl font-bold mb-6">Why CollabCode?</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {[
                { title: 'Simple', desc: 'Easy to use interface for all skill levels', icon: '✨' },
                { title: 'Powerful', desc: 'Full-featured version control system', icon: '⚡' },
                { title: 'Collaborative', desc: 'Work together seamlessly', icon: '🤝' }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl"
                  style={{ 
                    transform: `translateY(${(scrollY - 800) * 0.15}px)`,
                    transitionDelay: `${i * 100}ms`
                  }}
                >
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-lg opacity-90">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 to-pink-900 relative">
          <div 
            className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20"
            style={{ transform: `translateY(${scrollY * 0.4}px)` }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-full"
                style={{
                  width: `${Math.random() * 4 + 1}px`,
                  height: `${Math.random() * 4 + 1}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float ${Math.random() * 10 + 5}s infinite ease-in-out`
                }}
              />
            ))}
          </div>
          <div 
            className="max-w-2xl text-center text-white z-10"
            style={{ transform: `translateY(${(scrollY - 1400) * 0.2}px)` }}
          >
            <h2 className="text-6xl font-bold mb-6">Ready to start?</h2>
            <p className="text-2xl mb-8 opacity-90">Join thousands of developers collaborating on CollabCode</p>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-yellow-400 text-gray-900 px-12 py-4 rounded-full text-xl font-bold hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-2xl"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .animate-fade-in-delay-1 {
          animation: fade-in 1s ease-out 0.2s both;
        }
        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.4s both;
        }
      `}</style>
    </div>
  );
};
