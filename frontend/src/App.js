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

// PWA Installation
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
              <div className="text-xs text-gray-300">המבורגריה של דאלית אל כרמל</div>
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
            <span className="text-3xl md:text-4xl text-gray-300">המבורגרים הכי טעימים</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            בשר איכותי • לחמניות טריות • טעם בלתי נשכח
            <br />
            <span className="text-yellow-400">📍 דאלית אל כרמל</span>
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

// Keep existing components (BusinessMeals, BurgerOnly, etc.) with enhanced styling
// I'll continue with the rest in the next file...

// Wrap App with Toaster
const AppWithProvider = () => (
  <>
    <App />
    <Toaster position="top-center" />
  </>
);

export default AppWithProvider;