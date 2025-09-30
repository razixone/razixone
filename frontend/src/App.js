import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import shadcn components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
import { Checkbox } from './components/ui/checkbox';
import { Alert, AlertDescription } from './components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Toaster, toast } from './components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// PWA Installation Hook
const usePWA = () => {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);
};

// Cart Context
const CartContext = React.createContext();

export const useCart = () => {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prev => [...prev, { ...item, id: Date.now() + Math.random() }]);
    toast.success('נוסף לעגלה בהצלחה');
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getTotal }}>
      {children}
    </CartContext.Provider>
  );
};

// Premium Header Component
const Header = () => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <header className="bg-black text-white shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent"></div>
      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xl">RS</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">RS Burger</div>
              <div className="text-xs text-gray-300">ההמבורגר הכי טוב בעוספיא ובדאלית אל כרמל</div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="hidden md:flex gap-6">
            <Button 
              variant="ghost" 
              className={`text-white hover:text-yellow-400 transition-colors ${location.pathname === '/' ? 'text-yellow-400' : ''}`}
              onClick={() => navigate('/')}
            >
              בית
            </Button>
            <Button 
              variant="ghost" 
              className={`text-white hover:text-yellow-400 transition-colors ${location.pathname === '/menu' ? 'text-yellow-400' : ''}`}
              onClick={() => navigate('/menu')}
            >
              תפריט
            </Button>
            <Button 
              variant="ghost" 
              className={`text-white hover:text-yellow-400 transition-colors ${location.pathname === '/about' ? 'text-yellow-400' : ''}`}
              onClick={() => navigate('/about')}
            >
              עלינו
            </Button>
            <Button 
              variant="ghost" 
              className={`text-white hover:text-yellow-400 transition-colors ${location.pathname === '/gallery' ? 'text-yellow-400' : ''}`}
              onClick={() => navigate('/gallery')}
            >
              גלריה
            </Button>
            <Button 
              variant="ghost" 
              className={`text-white hover:text-yellow-400 transition-colors ${location.pathname === '/reviews' ? 'text-yellow-400' : ''}`}
              onClick={() => navigate('/reviews')}
            >
              חוות דעת
            </Button>
          </nav>

          <Button 
            className="bg-yellow-400 text-black hover:bg-yellow-300 font-semibold px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
            onClick={() => navigate('/cart')}
          >
            🛒 עגלה ({cart.length})
          </Button>
        </div>
      </div>
    </header>
  );
};

// Campaign Banner Component
const CampaignBanner = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await axios.get(`${API}/campaigns`);
        setCampaigns(response.data);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };

    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (campaigns.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % campaigns.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [campaigns.length]);

  if (campaigns.length === 0) return null;

  const currentCampaign = campaigns[currentIndex];

  return (
    <div 
      className="text-center py-3 px-4 text-black font-semibold animate-pulse"
      style={{ backgroundColor: currentCampaign.banner_color }}
    >
      <div className="flex items-center justify-center gap-2">
        <span>🔥</span>
        <span>{currentCampaign.title_he}</span>
        <span>🔥</span>
      </div>
      {campaigns.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {campaigns.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex ? 'bg-black' : 'bg-black/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Hero Section Component
const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[70vh] bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent"></div>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="text-yellow-400">RS Burger</span>
            <br />
            <span className="text-3xl md:text-4xl text-gray-300">ההמבורגר הכי טוב בעוספיא ובדאלית אל כרמל</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            בשר איכותי • לחמניות טריות • טעם בלתי נשכח
            <br />
            <span className="text-yellow-400">📍 תחנת דלק אל-עוקף, דאליית אל כרמל</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-4 text-xl rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl"
              onClick={() => navigate('/menu')}
            >
              🍔 הזמן עכשיו
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold px-8 py-4 text-xl rounded-full transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/about')}
            >
              📖 עלינו
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex justify-center items-center gap-8 text-yellow-400">
            <div className="text-center">
              <div className="text-2xl font-bold">1000+</div>
              <div className="text-sm text-gray-400">לקוחות מרוצים</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">⭐⭐⭐⭐⭐</div>
              <div className="text-sm text-gray-400">דירוג ממוצע</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">15 דק'</div>
              <div className="text-sm text-gray-400">זמן הכנה ממוצע</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main App Component
function App() {
  usePWA(); // Initialize PWA functionality
  
  return (
    <CartProvider>
      <div className="App" dir="rtl">
        <BrowserRouter>
          <CampaignBanner />
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogPostPage />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route path="/business-meals" element={<BusinessMeals />} />
            <Route path="/burger-only" element={<BurgerOnly />} />
            <Route path="/extras-sides-drinks" element={<ExtrasSidesDrinks />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-status/:orderId" element={<OrderStatus />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </BrowserRouter>
      </div>
    </CartProvider>
  );
}

// Home Component (Enhanced)
const Home = () => {
  const [settings, setSettings] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, blogRes] = await Promise.all([
          axios.get(`${API}/settings`),
          axios.get(`${API}/blog`)
        ]);
        setSettings(settingsRes.data);
        setBlogPosts(blogRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">טוען...</div>
      </div>
    );
  }

  if (!settings?.is_open && !settings?.manual_override) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-4 py-12 text-center">
          <Card className="max-w-md mx-auto bg-black/80 border-yellow-400 text-white">
            <CardContent className="p-8">
              <h1 className="text-2xl font-bold mb-4 text-red-400">כרגע סגור</h1>
              <p className="text-gray-300 mb-6">המסעדה סגורה כרגע</p>
              <p className="text-sm text-gray-400 mb-4">הזמנה עתידית? שלח לנו ווטסאפ</p>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.open('https://wa.me/972501234567', '_blank')}
              >
                💬 שלח ווטסאפ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">
      <HeroSection />
      
      {/* Quick Order Section */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-yellow-400">התפריט שלנו</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-gradient-to-br from-yellow-400/10 to-transparent border-yellow-400/30 hover:border-yellow-400 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">🍔</div>
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">ארוחות עסקיות</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">בורגר + צ'יפס + שתייה<br />החל מ-₪55</p>
                <Button 
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-full transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate('/business-meals')}
                >
                  בחר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-400/10 to-transparent border-orange-400/30 hover:border-orange-400 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">🥩</div>
                <h3 className="text-2xl font-bold mb-4 text-orange-400">בורגר בלבד</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">התאם אישית את הבורגר<br />החל מ-₪40</p>
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-full transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate('/burger-only')}
                >
                  בחר עכשיו
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-400/10 to-transparent border-red-400/30 hover:border-red-400 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">🍟</div>
                <h3 className="text-2xl font-bold mb-4 text-red-400">תוספות וצדדים</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">צ'יפס, שתייה ותוספות<br />החל מ-₪8</p>
                <Button 
                  className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-full transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate('/extras-sides-drinks')}
                >
                  בחר עכשיו
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      {blogPosts.length > 0 && (
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-yellow-400 mb-4">חדשות ועדכונים</h2>
              <p className="text-gray-400">הישאר מעודכן עם החדשות האחרונות מ-RS Burger</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {blogPosts.slice(0, 2).map(post => (
                <Card key={post.id} className="bg-gray-900 border-gray-700 hover:border-yellow-400 transition-all duration-300 cursor-pointer transform hover:scale-105" onClick={() => navigate(`/blog/${post.id}`)}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-yellow-400 mb-3">{post.title_he}</h3>
                    <p className="text-gray-300 mb-4">{post.summary_he}</p>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      קרא עוד
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black" onClick={() => navigate('/blog')}>
                כל הפוסטים
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto text-center">
            <div className="p-6">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-3">משלוח מהיר</h3>
              <p className="text-gray-300">משלוח חינם מעל ₪50 לאזור דאלית אל כרמל</p>
            </div>
            
            <div className="p-6">
              <div className="text-5xl mb-4">🥇</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-3">איכות פרימיום</h3>
              <p className="text-gray-300">רק בשר איכותי ורכיבים טריים</p>
            </div>
            
            <div className="p-6">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-3">שירות מעולה</h3>
              <p className="text-gray-300">צוות מקצועי ושירות לקוחות אדיב</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Menu Page Component
const MenuPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-yellow-400 mb-4">התפריט שלנו</h1>
          <p className="text-xl text-gray-300">בחר מהמגוון הרחב של המבורגרים הטעימים שלנו</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-yellow-400/10 to-transparent border-yellow-400/30 hover:border-yellow-400 transition-all duration-500 transform hover:scale-105 cursor-pointer" onClick={() => navigate('/business-meals')}>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-6">🍔</div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">ארוחות עסקיות</h3>
              <p className="text-gray-300 mb-6">בורגר + צ'יפס + שתייה</p>
              <div className="text-2xl font-bold text-yellow-400">₪55-120</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-400/10 to-transparent border-orange-400/30 hover:border-orange-400 transition-all duration-500 transform hover:scale-105 cursor-pointer" onClick={() => navigate('/burger-only')}>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-6">🥩</div>
              <h3 className="text-2xl font-bold mb-4 text-orange-400">בורגר בלבד</h3>
              <p className="text-gray-300 mb-6">התאמה אישית מלאה</p>
              <div className="text-2xl font-bold text-orange-400">₪40-105</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-400/10 to-transparent border-red-400/30 hover:border-red-400 transition-all duration-500 transform hover:scale-105 cursor-pointer" onClick={() => navigate('/extras-sides-drinks')}>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-6">🍟</div>
              <h3 className="text-2xl font-bold mb-4 text-red-400">תוספות וצדדים</h3>
              <p className="text-gray-300 mb-6">צ'יפס, שתייה ותוספות</p>
              <div className="text-2xl font-bold text-red-400">₪8-25</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// About Page Component
const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold text-yellow-400 mb-6">עלינו</h1>
              <p className="text-xl text-gray-300">הסיפור של RS Burger</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-3xl font-bold text-yellow-400 mb-6">המסע שלנו</h2>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  RS Burger נולד מחלום פשוט - להביא את המבורגרים הכי טעימים ואיכותיים לתושבי דאלית אל כרמל ולסביבה. 
                  התחלנו כפוד טראק קטן עם חזון גדול: לשרת בשר איכותי, לחמניות טריות ותוספות מעולות.
                </p>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  כל בורגר אצלנו מוכן בקפידה מבשר בקר טרי ואיכותי, עם תוספות שנבחרו בקפידה ורוטבים הכנים במקום. 
                  אנו גאים לספק חווית אוכל ייחודית שמשלבת טעמים מושלמים עם שירות חם ואדיב.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-gray-700/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-6xl">🚐</div>
                </div>
                <p className="text-sm text-gray-400">הפוד טראק שלנו בדאלית אל כרמל</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card className="bg-gradient-to-br from-yellow-400/10 to-transparent border-yellow-400/30 text-center">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">🥩</div>
                  <h3 className="text-xl font-bold text-yellow-400 mb-3">בשר איכותי</h3>
                  <p className="text-gray-300">רק בשר בקר טרי ואיכותי מספקים מובחרים</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-400/10 to-transparent border-orange-400/30 text-center">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">🍞</div>
                  <h3 className="text-xl font-bold text-orange-400 mb-3">לחמניות טריות</h3>
                  <p className="text-gray-300">לחמניות אפויות מדי יום במאפיות מקומיות</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-400/10 to-transparent border-red-400/30 text-center">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">💚</div>
                  <h3 className="text-xl font-bold text-red-400 mb-3">רכיבים טריים</h3>
                  <p className="text-gray-300">כל הירקות והתוספות טריים ואיכותיים</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-yellow-400/10 to-transparent rounded-2xl p-8 text-center border border-yellow-400/30">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">המיקום שלנו</h3>
              <p className="text-lg text-gray-300 mb-4">
                📍 דאלית אל כרמל - אנחנו נמצאים במקומות שונים בעיר לאורך השבוע
              </p>
              <p className="text-gray-400 mb-6">
                עקבו אחרינו ברשתות החברתיות לעדכונים על המיקום היומי שלנו
              </p>
              <Button 
                className="bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
                onClick={() => window.open('https://instagram.com/rs_burger1', '_blank')}
              >
                📱 עקבו אחרינו באינסטגרם
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Gallery Page Component
const GalleryPage = () => {
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstagramPosts = async () => {
      try {
        const response = await axios.get(`${API}/instagram/posts`);
        setInstagramPosts(response.data.data || []);
      } catch (error) {
        console.error('Error fetching Instagram posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstagramPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">טוען גלריה...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-yellow-400 mb-4">הגלריה שלנו</h1>
          <p className="text-xl text-gray-300 mb-6">תמונות טעימות מהאינסטגרם שלנו</p>
          <Button 
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-full"
            onClick={() => window.open('https://instagram.com/rs_burger1', '_blank')}
          >
            📱 עקבו אחרינו @rs_burger1
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {instagramPosts.map((post, index) => (
            <Card key={post.id} className="bg-gray-900 border-gray-700 hover:border-yellow-400 transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-yellow-400/20 to-gray-600/20 flex items-center justify-center">
                <div className="text-6xl">
                  {index % 3 === 0 ? '🍔' : index % 3 === 1 ? '🚐' : '🔥'}
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{post.caption}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(post.timestamp).toLocaleDateString('he-IL')}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-yellow-400 hover:text-yellow-300"
                    onClick={() => window.open(post.permalink, '_blank')}
                  >
                    צפה באינסטגרם
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {instagramPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📸</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">בקרוב...</h3>
            <p className="text-gray-300">הגלריה שלנו תתעדכן בקרוב עם תמונות טעימות</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Reviews Page Component
const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customer_name: '',
    rating: 5,
    comment: '',
    customer_phone: ''
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${API}/reviews`);
        setReviews(response.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/reviews`, formData);
      toast.success('תודה! חוות הדעת נשלחה לאישור');
      setFormData({ customer_name: '', rating: 5, comment: '', customer_phone: '' });
      setShowReviewForm(false);
    } catch (error) {
      toast.error('שגיאה בשליחת חוות הדעת');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-2xl ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
        ⭐
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">טוען חוות דעת...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-yellow-400 mb-4">חוות דעת לקוחות</h1>
          <p className="text-xl text-gray-300 mb-8">מה אומרים עלינו הלקוחות שלנו</p>
          
          <Button 
            className="bg-yellow-400 text-black hover:bg-yellow-300 font-bold px-6 py-3 rounded-full"
            onClick={() => setShowReviewForm(true)}
          >
            ✍️ כתוב חוות דעת
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-gradient-to-br from-gray-900 to-black border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="mr-3">
                    <AvatarFallback className="bg-yellow-400 text-black font-bold">
                      {review.customer_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-yellow-400">{review.customer_name}</h3>
                    <div className="flex">{renderStars(review.rating)}</div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed">{review.comment}</p>
                <div className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString('he-IL')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">💬</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">היה הראשון!</h3>
            <p className="text-gray-300">היה הראשון לכתוב חוות דעת על RS Burger</p>
          </div>
        )}

        {/* Review Form Modal */}
        <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">כתוב חוות דעת</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div>
                <Label htmlFor="customer_name">שם מלא</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({...prev, customer_name: e.target.value}))}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">טלפון (אופציונלי)</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({...prev, customer_phone: e.target.value}))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="050-1234567"
                />
              </div>

              <div>
                <Label>דירוג</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, rating: star}))}
                      className={`text-3xl transition-colors ${
                        star <= formData.rating ? 'text-yellow-400' : 'text-gray-600'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="comment">חוות דעת</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({...prev, comment: e.target.value}))}
                  className="bg-gray-800 border-gray-600 text-white"
                  rows={4}
                  placeholder="איך היה לכם ב-RS Burger?"
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1 bg-yellow-400 text-black hover:bg-yellow-300">
                  שלח חוות דעת
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)} className="flex-1">
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Blog Page Component
const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API}/blog`);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-yellow-400 mb-4">חדשות ועדכונים</h1>
          <p className="text-xl text-gray-300">הישאר מעודכן עם החדשות האחרונות מ-RS Burger</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {posts.map(post => (
            <Card key={post.id} className="bg-gradient-to-br from-gray-900 to-black border-gray-700 hover:border-yellow-400 transition-all duration-300 cursor-pointer transform hover:scale-105" onClick={() => navigate(`/blog/${post.id}`)}>
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-yellow-400 mb-4">{post.title_he}</h2>
                <p className="text-gray-300 mb-6 text-lg leading-relaxed">{post.summary_he}</p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                    קרא עוד
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('he-IL')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📰</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">בקרוב...</h3>
            <p className="text-gray-300">חדשות ועדכונים יתפרסמו בקרוב</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Blog Post Page Component
const BlogPostPage = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const postId = window.location.pathname.split('/').pop();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${API}/blog/${postId}`);
        setPost(response.data);
      } catch (error) {
        console.error('Error fetching blog post:', error);
        navigate('/blog');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">טוען...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">פוסט לא נמצא</h2>
          <Button onClick={() => navigate('/blog')}>חזור לבלוג</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => navigate('/blog')} className="mb-8">
            ← חזור לבלוג
          </Button>
          
          <article className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-6">{post.title_he}</h1>
            <div className="text-sm text-gray-400 mb-8">
              {new Date(post.created_at).toLocaleDateString('he-IL')}
            </div>
            
            <div className="prose prose-lg prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                {post.content_he}
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

// Loyalty Page Component
const LoyaltyPage = () => {
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const searchAccount = async () => {
    if (!phone) return;
    
    try {
      const response = await axios.get(`${API}/loyalty/${phone}`);
      setLoyaltyAccount(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setShowRegistration(true);
        setFormData(prev => ({ ...prev, phone }));
      } else {
        toast.error('שגיאה בחיפוש החשבון');
      }
    }
  };

  const registerAccount = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API}/loyalty/register`, formData);
      setLoyaltyAccount(response.data);
      setShowRegistration(false);
      toast.success('חשבון נוצר בהצלחה!');
    } catch (error) {
      toast.error('שגיאה ביצירת החשבון');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-yellow-400 mb-4">מועדון הנאמנות</h1>
            <p className="text-xl text-gray-300">צבור נקודות וקבל הנחות בכל הזמנה</p>
          </div>

          {!loyaltyAccount && !showRegistration && (
            <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">🎁</div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-6">חפש את החשבון שלך</h2>
                <div className="space-y-4">
                  <Input
                    type="tel"
                    placeholder="מספר טלפון"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <Button 
                    onClick={searchAccount}
                    className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
                  >
                    חפש חשבון
                  </Button>
                </div>
                
                <div className="mt-8 p-6 bg-yellow-400/10 rounded-xl border border-yellow-400/30">
                  <h3 className="text-xl font-bold text-yellow-400 mb-4">איך זה עובד?</h3>
                  <div className="text-right space-y-2 text-gray-300">
                    <p>• צבור 10% נקודות בכל הזמנה</p>
                    <p>• השתמש בנקודות להנחות עד 50%</p>
                    <p>• הצטרף חינם עם הטלפון שלך</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showRegistration && (
            <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">הצטרף למועדון הנאמנות</h2>
                
                <form onSubmit={registerAccount} className="space-y-6">
                  <div>
                    <Label htmlFor="name">שם מלא</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">טלפון</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">אימייל (אופציונלי)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1 bg-yellow-400 text-black hover:bg-yellow-300">
                      הצטרף למועדון
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowRegistration(false)} className="flex-1">
                      ביטול
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loyaltyAccount && (
            <Card className="bg-gradient-to-br from-yellow-400/10 to-transparent border-yellow-400">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2">שלום {loyaltyAccount.name}!</h2>
                  <p className="text-gray-300">חבר מועדון הנאמנות</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4 bg-gradient-to-br from-green-400/10 to-transparent rounded-xl border border-green-400/30">
                    <div className="text-3xl font-bold text-green-400">₪{loyaltyAccount.points.toFixed(0)}</div>
                    <div className="text-sm text-gray-300">יתרת נקודות</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-blue-400/10 to-transparent rounded-xl border border-blue-400/30">
                    <div className="text-3xl font-bold text-blue-400">{loyaltyAccount.orders_count}</div>
                    <div className="text-sm text-gray-300">הזמנות בוצעו</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-purple-400/10 to-transparent rounded-xl border border-purple-400/30">
                    <div className="text-3xl font-bold text-purple-400">₪{loyaltyAccount.total_spent.toFixed(0)}</div>
                    <div className="text-sm text-gray-300">סה"כ הוצא</div>
                  </div>
                </div>

                <div className="text-center">
                  <Button 
                    className="bg-yellow-400 text-black hover:bg-yellow-300 font-bold px-8 py-3"
                    onClick={() => navigate('/menu')}
                  >
                    השתמש בנקודות - הזמן עכשיו
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Business Meals Component
const BusinessMeals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products/business_meal`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching business meals:', error);
        toast.error('שגיאה בטעינת הארוחות העסקיות');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    const cartItem = {
      product_id: product.id,
      product_name_he: product.name_he,
      product_type: product.type,
      size: product.size,
      quantity: 1,
      base_price: product.price,
      addons: [],
      total_price: product.price
    };
    
    addToCart(cartItem);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/menu')}
            className="mb-4 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
          >
            ← חזור לתפריט
          </Button>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">ארוחות עסקיות</h1>
          <p className="text-gray-300 text-lg">כל ארוחה כוללת בורגר + צ'יפס + שתייה</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <Card key={product.id} className="bg-gradient-to-br from-yellow-400/10 to-transparent border-yellow-400/30 hover:border-yellow-400 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-yellow-400/20 to-gray-600/20 flex items-center justify-center rounded-t-lg">
                <div className="text-6xl">🍔</div>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-yellow-400 mb-2">{product.name_he}</h3>
                    <p className="text-sm text-gray-300 mb-3">{product.description_he}</p>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      {product.size}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-yellow-400">₪{product.price}</div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-full transition-all duration-300 transform hover:scale-105"
                  onClick={() => handleAddToCart(product)}
                >
                  הוסף לעגלה
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

// Enhanced Burger Only Component (keeping existing logic, adding premium styling)
const BurgerOnly = () => {
  const [products, setProducts] = useState([]);
  const [addons, setAddons] = useState([]);
  const [sides, setSides] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedSide, setSelectedSide] = useState(null);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, addonsRes, sidesRes, drinksRes] = await Promise.all([
          axios.get(`${API}/products/burger_only`),
          axios.get(`${API}/addons`),
          axios.get(`${API}/products/side`),
          axios.get(`${API}/products/drink`)
        ]);
        
        setProducts(productsRes.data);
        setAddons(addonsRes.data);
        setSides(sidesRes.data);
        setDrinks(drinksRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateTotal = () => {
    let total = selectedProduct ? selectedProduct.price : 0;
    total += selectedAddons.length * 8;
    total += selectedSide ? selectedSide.price : 0;
    total += selectedDrink ? selectedDrink.price : 0;
    return total;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      toast.error('אנא בחר גודל בורגר');
      return;
    }

    const addonsList = selectedAddons.map(addon => ({
      addon_id: addon.id,
      name_he: addon.name_he,
      price: addon.price
    }));

    const cartItem = {
      product_id: selectedProduct.id,
      product_name_he: selectedProduct.name_he,
      product_type: selectedProduct.type,
      size: selectedProduct.size,
      quantity: 1,
      base_price: selectedProduct.price,
      addons: addonsList,
      total_price: calculateTotal()
    };

    addToCart(cartItem);
    
    if (selectedSide) {
      const sideItem = {
        product_id: selectedSide.id,
        product_name_he: selectedSide.name_he,
        product_type: selectedSide.type,
        quantity: 1,
        base_price: selectedSide.price,
        addons: [],
        total_price: selectedSide.price
      };
      addToCart(sideItem);
    }

    if (selectedDrink) {
      const drinkItem = {
        product_id: selectedDrink.id,
        product_name_he: selectedDrink.name_he,
        product_type: selectedDrink.type,
        quantity: 1,
        base_price: selectedDrink.price,
        addons: [],
        total_price: selectedDrink.price
      };
      addToCart(drinkItem);
    }

    setSelectedProduct(null);
    setSelectedAddons([]);
    setSelectedSide(null);
    setSelectedDrink(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/menu')}
            className="mb-4 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
          >
            ← חזור לתפריט
          </Button>
          <h1 className="text-4xl font-bold text-orange-400 mb-2">בורגר בלבד</h1>
          <p className="text-gray-300 text-lg">בחר גודל והתאם אישית את הבורגר שלך</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Burger Size Selection */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-orange-400 text-2xl">גודל בורגר</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div 
                    key={product.id}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      selectedProduct?.id === product.id 
                        ? 'border-orange-500 bg-orange-500/10 shadow-lg' 
                        : 'border-gray-600 hover:border-orange-400 bg-gradient-to-br from-gray-800 to-gray-900'
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">🍔</div>
                      <h4 className="font-bold text-orange-400 mb-2">{product.name_he}</h4>
                      <Badge className="bg-orange-100 text-orange-800 mb-3">
                        ₪{product.price}
                      </Badge>
                      <div className="text-sm text-gray-300">{product.size}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Addons Selection */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-yellow-400 text-2xl">תוספות (₪8 כל אחת)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addons.map(addon => (
                  <div key={addon.id} className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 hover:from-yellow-400/10 hover:to-gray-800 transition-all duration-300">
                    <Checkbox
                      id={addon.id}
                      checked={selectedAddons.some(a => a.id === addon.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAddons(prev => [...prev, addon]);
                        } else {
                          setSelectedAddons(prev => prev.filter(a => a.id !== addon.id));
                        }
                      }}
                      className="border-yellow-400 data-[state=checked]:bg-yellow-400"
                    />
                    <Label htmlFor={addon.id} className="text-sm font-medium mr-2 text-gray-300 cursor-pointer">
                      {addon.name_he}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optional Sides */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-red-400 text-2xl">צדדים (אופציונלי)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {sides.map(side => (
                  <div 
                    key={side.id}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      selectedSide?.id === side.id 
                        ? 'border-red-500 bg-red-500/10 shadow-lg' 
                        : 'border-gray-600 hover:border-red-400 bg-gradient-to-br from-gray-800 to-gray-900'
                    }`}
                    onClick={() => setSelectedSide(selectedSide?.id === side.id ? null : side)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl mb-2">🍟</div>
                        <h4 className="font-bold text-red-400 mb-2">{side.name_he}</h4>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        ₪{side.price}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optional Drinks */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-blue-400 text-2xl">שתייה (אופציונלי)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {drinks.map(drink => (
                  <div 
                    key={drink.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 text-center transform hover:scale-105 ${
                      selectedDrink?.id === drink.id 
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg' 
                        : 'border-gray-600 hover:border-blue-400 bg-gradient-to-br from-gray-800 to-gray-900'
                    }`}
                    onClick={() => setSelectedDrink(selectedDrink?.id === drink.id ? null : drink)}
                  >
                    <div className="text-2xl mb-2">🥤</div>
                    <div className="font-medium text-sm text-blue-400 mb-2">{drink.name_he}</div>
                    <Badge className="bg-blue-100 text-blue-800">
                      ₪{drink.price}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Total and Add to Cart */}
          <Card className="bg-gradient-to-br from-yellow-400/10 to-transparent border-yellow-400">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-white">סה"כ:</span>
                <span className="text-4xl font-bold text-yellow-400">₪{calculateTotal()}</span>
              </div>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-4 text-xl rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddToCart}
                disabled={!selectedProduct}
              >
                {!selectedProduct ? 'בחר גודל בורגר' : 'הוסף לעגלה'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Enhanced Extras, Sides & Drinks Component
const ExtrasSidesDrinks = () => {
  const [sides, setSides] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sidesRes, drinksRes] = await Promise.all([
          axios.get(`${API}/products/side`),
          axios.get(`${API}/products/drink`)
        ]);
        
        setSides(sidesRes.data);
        setDrinks(drinksRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product) => {
    const cartItem = {
      product_id: product.id,
      product_name_he: product.name_he,
      product_type: product.type,
      quantity: 1,
      base_price: product.price,
      addons: [],
      total_price: product.price
    };
    
    addToCart(cartItem);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/menu')}
            className="mb-4 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
          >
            ← חזור לתפריט
          </Button>
          <h1 className="text-4xl font-bold text-red-400 mb-2">תוספות/צ'יפס/שתייה</h1>
          <p className="text-gray-300 text-lg">הוסף צדדים טעימים להזמנה שלך</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Sides */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-red-400 text-2xl">צדדים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {sides.map(side => (
                  <div key={side.id} className="flex items-center justify-between p-6 border border-gray-600 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 hover:border-red-400 transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center">
                      <div className="text-4xl mr-4">🍟</div>
                      <div>
                        <h3 className="font-bold text-red-400 text-lg">{side.name_he}</h3>
                        <Badge className="bg-red-100 text-red-800 mt-2">
                          ₪{side.price}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      className="bg-red-500 hover:bg-red-400 text-white font-bold px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
                      onClick={() => handleAddToCart(side)}
                    >
                      הוסף לעגלה
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Drinks */}
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-blue-400 text-2xl">שתייה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {drinks.map(drink => (
                  <div key={drink.id} className="text-center p-6 border border-gray-600 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 hover:border-blue-400 transition-all duration-300 transform hover:scale-105">
                    <div className="text-3xl mb-3">🥤</div>
                    <h3 className="font-bold text-blue-400 mb-3">{drink.name_he}</h3>
                    <Badge className="bg-blue-100 text-blue-800 mb-4">
                      ₪{drink.price}
                    </Badge>
                    <Button 
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 rounded-full transition-all duration-300 transform hover:scale-105"
                      onClick={() => handleAddToCart(drink)}
                    >
                      הוסף לעגלה
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Enhanced Cart Component
const Cart = () => {
  const { cart, removeFromCart, getTotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto bg-gradient-to-br from-gray-900 to-black border-gray-700 text-center">
            <CardContent className="p-12">
              <div className="text-6xl mb-6">🛒</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">העגלה ריקה</h2>
              <p className="text-gray-300 mb-8">עדיין לא הוספת מוצרים לעגלה</p>
              <Button 
                onClick={() => navigate('/menu')}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-full"
              >
                חזור להזמנה
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">עגלת קניות</h1>
          <p className="text-gray-300">{cart.length} פריטים בעגלה</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700 mb-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start p-4 border border-gray-600 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50">
                    <div className="flex-1">
                      <h3 className="font-bold text-yellow-400 text-lg">{item.product_name_he}</h3>
                      {item.size && (
                        <p className="text-sm text-gray-400 mt-1">גודל: {item.size}</p>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <div className="text-sm text-gray-400 mt-1">
                          תוספות: {item.addons.map(addon => addon.name_he).join(', ')}
                        </div>
                      )}
                      <div className="text-xl font-bold text-green-400 mt-2">
                        ₪{item.total_price}
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="bg-red-600 hover:bg-red-700 ml-4"
                    >
                      🗑️ הסר
                    </Button>
                  </div>
                ))}
              </div>

              <Separator className="my-6 bg-gray-600" />

              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-white">סה"כ:</span>
                <span className="text-3xl font-bold text-green-400">₪{getTotal()}</span>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={clearCart}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  🗑️ נקה עגלה
                </Button>
                <Button 
                  onClick={() => navigate('/checkout')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-full"
                >
                  💳 לקופה
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Enhanced Checkout Component (keeping existing logic, adding premium styling)
const Checkout = () => {
  const { cart, getTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    order_type: 'pickup',
    delivery_address: '',
    notes: '',
    payment_method: 'מזומן'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_phone) {
      toast.error('חסר שם או טלפון');
      return;
    }

    if (formData.order_type === 'delivery' && !formData.delivery_address) {
      toast.error('כתובת לא בטווח משלוחים');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        ...formData,
        order_type: formData.order_type === 'pickup' ? 'איסוף' : 'משלוח',
        payment_method: formData.payment_method,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          addon_ids: item.addons ? item.addons.map(addon => addon.addon_id) : []
        }))
      };

      const response = await axios.post(`${API}/orders`, orderData);
      const order = response.data;
      
      toast.success('ההזמנה נוצרה בהצלחה!');
      clearCart();
      navigate(`/order-status/${order.id}`);
      
    } catch (error) {
      console.error('Error creating order:', error);
      if (error.response?.status === 400 && error.response.data.detail === 'יש עומס, ההזמנה נכנסה לתור') {
        toast.warning('יש עומס כרגע, ההזמנה נכנסה לתור המתנה');
      } else {
        toast.error('שגיאה ביצירת ההזמנה');
      }
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/');
    return null;
  }

  const deliveryFee = formData.order_type === 'delivery' ? 15 : 0;
  const totalWithDelivery = getTotal() + deliveryFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/cart')}
            className="mb-4 border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
          >
            ← חזור לעגלה
          </Button>
          <h1 className="text-4xl font-bold text-green-400 mb-2">פרטי הזמנה</h1>
          <p className="text-gray-300">מלא את הפרטים להשלמת ההזמנה</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="customer_name" className="text-gray-300">שם מלא *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({...prev, customer_name: e.target.value}))}
                      placeholder="הכנס את שמך המלא"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer_phone" className="text-gray-300">טלפון *</Label>
                    <Input
                      id="customer_phone"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData(prev => ({...prev, customer_phone: e.target.value}))}
                      placeholder="050-1234567"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customer_email" className="text-gray-300">אימייל (אופציונלי)</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData(prev => ({...prev, customer_email: e.target.value}))}
                    placeholder="example@email.com"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-300 mb-3 block">סוג הזמנה</Label>
                  <RadioGroup
                    value={formData.order_type}
                    onValueChange={(value) => setFormData(prev => ({...prev, order_type: value}))}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                      <RadioGroupItem value="pickup" id="pickup" className="border-green-400" />
                      <Label htmlFor="pickup" className="mr-2 text-gray-300 cursor-pointer">איסוף עצמי (חינם)</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                      <RadioGroupItem value="delivery" id="delivery" className="border-green-400" />
                      <Label htmlFor="delivery" className="mr-2 text-gray-300 cursor-pointer">משלוח (+₪15)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.order_type === 'delivery' && (
                  <div>
                    <Label htmlFor="delivery_address" className="text-gray-300">כתובת משלוח *</Label>
                    <Input
                      id="delivery_address"
                      value={formData.delivery_address}
                      onChange={(e) => setFormData(prev => ({...prev, delivery_address: e.target.value}))}
                      placeholder="רחוב, מספר בית, עיר"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                    <p className="text-sm text-gray-400 mt-2">* משלוח זמין באזור דאלית אל כרמל</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes" className="text-gray-300">הערות (אופציונלי)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="הערות מיוחדות להזמנה..."
                    rows={3}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-300 mb-3 block">אמצעי תשלום</Label>
                  <RadioGroup
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData(prev => ({...prev, payment_method: value}))}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                      <RadioGroupItem value="מזומן" id="cash" className="border-green-400" />
                      <Label htmlFor="cash" className="mr-2 text-gray-300 cursor-pointer">💵 מזומן</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                      <RadioGroupItem value="Bit" id="bit" className="border-green-400" />
                      <Label htmlFor="bit" className="mr-2 text-gray-300 cursor-pointer">📱 Bit</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                      <RadioGroupItem value="כרטיס אשראי" id="card" className="border-green-400" />
                      <Label htmlFor="card" className="mr-2 text-gray-300 cursor-pointer">💳 כרטיס אשראי</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator className="bg-gray-600" />

                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>סכום הזמנה:</span>
                    <span>₪{getTotal()}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>דמי משלוח:</span>
                      <span>₪{deliveryFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span className="text-white">סה"כ לתשלום:</span>
                    <span className="text-3xl text-green-400">₪{totalWithDelivery}</span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-xl rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '🔄 מעבד...' : '🎯 בצע הזמנה'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Enhanced Order Status Component (keeping existing logic, adding premium styling)
const OrderStatus = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const orderId = window.location.pathname.split('/').pop();
    
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${API}/orders/${orderId}`);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('שגיאה בטעינת ההזמנה');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">טוען...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center text-white">
        <Card className="max-w-md mx-auto bg-gradient-to-br from-gray-900 to-black border-gray-700 text-center">
          <CardContent className="p-8">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-4 text-red-400">הזמנה לא נמצאה</h2>
            <Button onClick={() => navigate('/')} className="bg-yellow-400 text-black hover:bg-yellow-300">
              חזור לדף הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusSteps = [
    { key: 'נוצרה', label: 'נוצרה', icon: '📝', color: 'blue' },
    { key: 'ממתינה', label: 'ממתינה', icon: '⏳', color: 'yellow' },
    { key: 'בהכנה', label: 'בהכנה', icon: '👨‍🍳', color: 'orange' },
    { key: 'מוכן', label: order.order_type === 'משלוח' ? 'בדרכו' : 'מוכן', icon: order.order_type === 'משלוח' ? '🚗' : '✅', color: 'green' }
  ];

  const currentIndex = statusSteps.findIndex(step => step.key === order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700 mb-6">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-yellow-400 mb-2">מעקב הזמנה</h1>
                <p className="text-gray-300">הזמנה מספר: {order.id.slice(-8)}</p>
                <Badge className={`mt-3 px-3 py-1 text-sm ${
                  order.status === 'נוצרה' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'ממתינה' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'בהכנה' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {order.status}
                </Badge>
              </div>

              {/* Status Timeline */}
              <div className="relative">
                <div className="flex justify-between items-center mb-8">
                  {statusSteps.map((step, index) => (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-500 ${
                        index <= currentIndex 
                          ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg transform scale-110' 
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {step.icon}
                      </div>
                      <p className={`mt-3 text-sm font-medium transition-colors ${
                        index <= currentIndex ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </p>
                      {index < statusSteps.length - 1 && (
                        <div className={`absolute top-8 right-8 w-20 h-0.5 transition-colors ${
                          index < currentIndex ? 'bg-green-400' : 'bg-gray-700'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-6 bg-gray-600" />

              {/* Order Details */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">לקוח:</span>
                  <span className="font-medium text-white">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">טלפון:</span>
                  <span className="font-medium text-white">{order.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">סוג הזמנה:</span>
                  <span className="font-medium text-white">{order.order_type}</span>
                </div>
                {order.delivery_address && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">כתובת:</span>
                    <span className="font-medium text-white">{order.delivery_address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">תשלום:</span>
                  <span className="font-medium text-white">{order.payment_method}</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-white">סה"כ:</span>
                  <span className="text-green-400">₪{order.total}</span>
                </div>
              </div>

              {/* Status Message */}
              <Alert className="mt-6 bg-gradient-to-r from-yellow-400/10 to-transparent border-yellow-400/50">
                <AlertDescription className="text-gray-300">
                  {order.status === 'נוצרה' && '✅ ההזמנה נתקבלה ועומדת בתור להכנה'}
                  {order.status === 'ממתינה' && '⏳ יש עומס כרגע, ההזמנה ממתינה בתור'}
                  {order.status === 'בהכנה' && '👨‍🍳 ההזמנה כרגע בהכנה במטבח'}
                  {order.status === 'מוכן' && order.order_type === 'איסוף' && '🎉 ההזמנה מוכנה לאיסוף!'}
                  {order.status === 'מוכן' && order.order_type === 'משלוח' && '🚗 ההזמנה יצאה למשלוח ובדרכה אליך!'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Button 
            onClick={() => navigate('/')}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold py-3 rounded-full"
            variant="outline"
          >
            🏠 הזמנה חדשה
          </Button>
        </div>
      </main>
    </div>
  );
};

// Enhanced Admin Panel (keeping existing functionality, adding premium styling)
const AdminPanel = () => {
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const authenticate = async () => {
    try {
      await axios.patch(`${API}/settings?admin_pin=${pin}`, {});
      setAuthenticated(true);
      fetchData();
    } catch (error) {
      toast.error('קוד אדמין שגוי');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, settingsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/settings`)
      ]);
      setOrders(ordersRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API}/orders/${orderId}/status?status=${newStatus}`);
      toast.success('סטטוס עודכן');
      fetchData();
    } catch (error) {
      toast.error('שגיאה בעדכון סטטוס');
    }
  };

  const toggleOpen = async () => {
    try {
      await axios.patch(`${API}/settings?admin_pin=${pin}`, {
        is_open: !settings.is_open,
        manual_override: true
      });
      toast.success('סטטוס עודכן');
      fetchData();
    } catch (error) {
      toast.error('שגיאה בעדכון');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center text-white">
        <Card className="max-w-sm mx-auto bg-gradient-to-br from-gray-900 to-black border-gray-700">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-2xl font-semibold text-yellow-400">כניסה למנהל</h2>
            </div>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="קוד אדמין"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && authenticate()}
                className="bg-gray-800 border-gray-600 text-white"
              />
              <Button 
                onClick={authenticate}
                className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
              >
                🔓 כניסה
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-400 text-2xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white">
      <header className="bg-gradient-to-r from-black to-gray-900 border-b border-gray-700 shadow-xl">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">🔧 פאנל ניהול - RS Burger</h1>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
          >
            🏠 לאתר
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Settings */}
        <Card className="mb-8 bg-gradient-to-br from-gray-900 to-black border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 text-xl">⚙️ הגדרות מסעדה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <span className="font-medium text-white text-lg">סטטוס מסעדה:</span>
              <Button
                onClick={toggleOpen}
                className={`px-6 py-3 rounded-full font-bold text-lg ${
                  settings?.is_open 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {settings?.is_open ? '🟢 פתוח' : '🔴 סגור'}
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-gradient-to-r from-blue-400/10 to-transparent rounded-lg border border-blue-400/30">
                <div className="text-blue-400 font-bold">טווח משלוח</div>
                <div className="text-white text-lg">{settings?.delivery_radius_km} ק"מ</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-400/10 to-transparent rounded-lg border border-green-400/30">
                <div className="text-green-400 font-bold">עלות משלוח</div>
                <div className="text-white text-lg">₪{settings?.delivery_fee}</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-400/10 to-transparent rounded-lg border border-purple-400/30">
                <div className="text-purple-400 font-bold">מקסימום הזמנות</div>
                <div className="text-white text-lg">{settings?.max_parallel_orders}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 text-xl">📋 הזמנות ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="border border-gray-600 rounded-xl p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:border-yellow-400 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-yellow-400">
                        {order.customer_name} - {order.customer_phone}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {order.order_type} | ₪{order.total} | {order.payment_method}
                      </p>
                      {order.delivery_address && (
                        <p className="text-sm text-gray-300">📍 {order.delivery_address}</p>
                      )}
                    </div>
                    <Badge className={`px-3 py-1 ${
                      order.status === 'נוצרה' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'ממתינה' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'בהכנה' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-300 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="mb-1">
                        📦 {item.product_name_he} 
                        {item.size && ` (${item.size})`}
                        {item.addons.length > 0 && ` + ${item.addons.map(a => a.name_he).join(', ')}`}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'נוצרה')}
                      disabled={order.status === 'נוצרה'}
                      variant="outline"
                      className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white disabled:opacity-50"
                    >
                      📝 נוצרה
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'ממתינה')}
                      disabled={order.status === 'ממתינה'}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
                    >
                      ⏳ ממתינה
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'בהכנה')}
                      disabled={order.status === 'בהכנה'}
                      className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                    >
                      👨‍🍳 בהכנה
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'מוכן')}
                      disabled={order.status === 'מוכן'}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    >
                      ✅ מוכן
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">אין הזמנות כרגע</h3>
                <p className="text-gray-300">הזמנות חדשות יופיעו כאן</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// Wrap App with Toaster
const AppWithProvider = () => (
  <>
    <App />
    <Toaster position="top-center" />
  </>
);

export default AppWithProvider;