import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Main App Component
function App() {
  return (
    <div className="App" dir="rtl">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
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
  );
}

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

// Header Component
const Header = () => {
  const { cart } = useCart();
  
  return (
    <header className="bg-black text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-yellow-400">RS Burger</div>
          <div className="text-sm opacity-75">המבורגר הכי טעים בעיר</div>
        </div>
        <Button 
          variant="outline" 
          className="bg-yellow-400 text-black hover:bg-yellow-300 border-yellow-400"
          onClick={() => window.location.href = '/cart'}
        >
          עגלה ({cart.length})
        </Button>
      </div>
    </header>
  );
};

// Home Component
const Home = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API}/settings`);
        setSettings(response.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const seedDatabase = async () => {
    try {
      await axios.post(`${API}/seed`);
      toast.success('נתונים נוספו בהצלחה');
    } catch (error) {
      toast.error('שגיאה בהוספת נתונים');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>טוען...</div>
      </div>
    );
  }

  if (!settings?.is_open) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <h1 className="text-2xl font-bold mb-4 text-red-600">כרגע סגור</h1>
              <p className="text-gray-600 mb-6">המסעדה סגורה כרגע</p>
              <p className="text-sm text-gray-500">הזמנה עתידית? שלח לנו ווטסאפ</p>
              <Button 
                className="mt-4 bg-green-600 hover:bg-green-700"
                onClick={() => window.open('https://wa.me/972501234567', '_blank')}
              >
                שלח ווטסאפ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            ברוכים הבאים ל-RS Burger
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            המבורגרים הכי טעימים וטריים בעיר
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="hover:shadow-xl transition-shadow border-2 border-yellow-200 hover:border-yellow-400">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🍔</div>
              <h2 className="text-xl font-semibold mb-4">ארוחות עסקיות</h2>
              <p className="text-gray-600 mb-6">בורגר + צ'יפס + שתייה</p>
              <Button 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                onClick={() => window.location.href = '/business-meals'}
              >
                בחר
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow border-2 border-orange-200 hover:border-orange-400">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🥩</div>
              <h2 className="text-xl font-semibold mb-4">בורגר בלבד</h2>
              <p className="text-gray-600 mb-6">רק הבורגר עם תוספות לפי בחירה</p>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                onClick={() => window.location.href = '/burger-only'}
              >
                בחר
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow border-2 border-red-200 hover:border-red-400">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🍟</div>
              <h2 className="text-xl font-semibold mb-4">תוספות/צ'יפס/שתייה</h2>
              <p className="text-gray-600 mb-6">תוספות וצדדים טעימים</p>
              <Button 
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold"
                onClick={() => window.location.href = '/extras-sides-drinks'}
              >
                בחר
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dev button to seed database */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            onClick={seedDatabase}
            className="text-xs opacity-50"
          >
            Seed Database (Dev)
          </Button>
        </div>
      </main>
    </div>
  );
};

// Business Meals Component
const BusinessMeals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

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
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="mb-4"
          >
            ← חזור לדף הבית
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ארוחות עסקיות</h1>
          <p className="text-gray-600">כל ארוחה כולל צ'יפס + שתייה</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name_he}</h3>
                    <p className="text-sm text-gray-600">{product.description_he}</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    ₪{product.price}
                  </Badge>
                </div>
                
                <Button 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
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

// Burger Only Component  
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
    total += selectedAddons.length * 8; // Each addon is ₪8
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
    
    // Add side separately if selected
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

    // Add drink separately if selected
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

    // Reset form
    setSelectedProduct(null);
    setSelectedAddons([]);
    setSelectedSide(null);
    setSelectedDrink(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="mb-4"
          >
            ← חזור לדף הבית
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">בורגר בלבד</h1>
          <p className="text-gray-600">בחר גודל והתאם אישית את הבורגר שלך</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Burger Size Selection */}
          <Card>
            <CardHeader>
              <CardTitle>גודל בורגר</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div 
                    key={product.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedProduct?.id === product.id 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{product.name_he}</span>
                      <Badge className="bg-orange-100 text-orange-800">
                        ₪{product.price}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Addons Selection */}
          <Card>
            <CardHeader>
              <CardTitle>תוספות (₪8 כל אחת)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addons.map(addon => (
                  <div key={addon.id} className="flex items-center space-x-2">
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
                    />
                    <Label htmlFor={addon.id} className="text-sm font-medium mr-2">
                      {addon.name_he}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optional Sides */}
          <Card>
            <CardHeader>
              <CardTitle>צדדים (אופציונלי)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {sides.map(side => (
                  <div 
                    key={side.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedSide?.id === side.id 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedSide(selectedSide?.id === side.id ? null : side)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{side.name_he}</span>
                      <Badge className="bg-gray-100 text-gray-800">
                        ₪{side.price}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optional Drinks */}
          <Card>
            <CardHeader>
              <CardTitle>שתייה (אופציונלי)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {drinks.map(drink => (
                  <div 
                    key={drink.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                      selectedDrink?.id === drink.id 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedDrink(selectedDrink?.id === drink.id ? null : drink)}
                  >
                    <div className="font-medium text-sm">{drink.name_he}</div>
                    <Badge className="bg-gray-100 text-gray-800 mt-1">
                      ₪{drink.price}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Total and Add to Cart */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">סה"כ:</span>
                <span className="text-2xl font-bold text-orange-600">₪{calculateTotal()}</span>
              </div>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
                onClick={handleAddToCart}
                disabled={!selectedProduct}
              >
                הוסף לעגלה
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Extras, Sides & Drinks Component
const ExtrasSidesDrinks = () => {
  const [sides, setSides] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

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
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="mb-4"
          >
            ← חזור לדף הבית
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">תוספות/צ'יפס/שתייה</h1>
          <p className="text-gray-600">הוסף צדדים טעימים להזמנה שלך</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Sides */}
          <Card>
            <CardHeader>
              <CardTitle>צדדים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {sides.map(side => (
                  <div key={side.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{side.name_he}</h3>
                      <Badge className="bg-red-100 text-red-800">
                        ₪{side.price}
                      </Badge>
                    </div>
                    <Button 
                      className="bg-red-500 hover:bg-red-600 text-white"
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
          <Card>
            <CardHeader>
              <CardTitle>שתייה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {drinks.map(drink => (
                  <div key={drink.id} className="text-center p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">{drink.name_he}</h3>
                    <Badge className="bg-blue-100 text-blue-800 mb-3">
                      ₪{drink.price}
                    </Badge>
                    <Button 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm"
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

// Cart Component
const Cart = () => {
  const { cart, removeFromCart, getTotal, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold mb-4">העגלה ריקה</h2>
              <p className="text-gray-600 mb-6">עדיין לא הוספת מוצרים לעגלה</p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">עגלת קניות</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product_name_he}</h3>
                      {item.size && (
                        <p className="text-sm text-gray-600">גודל: {item.size}</p>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <div className="text-sm text-gray-600">
                          תוספות: {item.addons.map(addon => addon.name_he).join(', ')}
                        </div>
                      )}
                      <div className="text-lg font-semibold text-gray-900 mt-2">
                        ₪{item.total_price}
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      הסר
                    </Button>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-semibold">סה"כ:</span>
                <span className="text-2xl font-bold text-green-600">₪{getTotal()}</span>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={clearCart}
                  className="flex-1"
                >
                  נקה עגלה
                </Button>
                <Button 
                  onClick={() => window.location.href = '/checkout'}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  לקופה
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Checkout Component
const Checkout = () => {
  const { cart, getTotal, clearCart } = useCart();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
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
      window.location.href = `/order-status/${order.id}`;
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('שגיאה ביצירת ההזמנה');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/cart'}
            className="mb-4"
          >
            ← חזור לעגלה
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">פרטי הזמנה</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="customer_name">שם מלא *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({...prev, customer_name: e.target.value}))}
                    placeholder="הכנס את שמך המלא"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customer_phone">טלפון *</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({...prev, customer_phone: e.target.value}))}
                    placeholder="050-1234567"
                    required
                  />
                </div>

                <div>
                  <Label>סוג הזמנה</Label>
                  <RadioGroup
                    value={formData.order_type}
                    onValueChange={(value) => setFormData(prev => ({...prev, order_type: value}))}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="mr-2">איסוף עצמי</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery" className="mr-2">משלוח (₪15)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.order_type === 'delivery' && (
                  <div>
                    <Label htmlFor="delivery_address">כתובת משלוח *</Label>
                    <Input
                      id="delivery_address"
                      value={formData.delivery_address}
                      onChange={(e) => setFormData(prev => ({...prev, delivery_address: e.target.value}))}
                      placeholder="רחוב, מספר בית, עיר"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">הערות (אופציונלי)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="הערות מיוחדות להזמנה..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>אמצעי תשלום</Label>
                  <RadioGroup
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData(prev => ({...prev, payment_method: value}))}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="מזומן" id="cash" />
                      <Label htmlFor="cash" className="mr-2">מזומן</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Bit" id="bit" />
                      <Label htmlFor="bit" className="mr-2">Bit</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold">סה"כ לתשלום:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₪{getTotal() + (formData.order_type === 'delivery' ? 15 : 0)}
                  </span>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  disabled={loading}
                >
                  {loading ? 'מעבד...' : 'בצע הזמנה'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Order Status Component
const OrderStatus = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">טוען...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-4 text-red-600">הזמנה לא נמצאה</h2>
            <Button onClick={() => window.location.href = '/'}>
              חזור לדף הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusSteps = [
    { key: 'נוצרה', label: 'נוצרה', icon: '📝' },
    { key: 'בהכנה', label: 'בהכנה', icon: '👨‍🍳' },
    { key: 'מוכן', label: order.order_type === 'משלוח' ? 'בדרכו' : 'מוכן', icon: order.order_type === 'משלוח' ? '🚗' : '✅' }
  ];

  const currentIndex = statusSteps.findIndex(step => step.key === order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">מעקב הזמנה</h1>
                <p className="text-gray-600">הזמנה מספר: {order.id.slice(-8)}</p>
              </div>

              {/* Status Timeline */}
              <div className="flex justify-between items-center mb-8">
                {statusSteps.map((step, index) => (
                  <div key={step.key} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                      index <= currentIndex ? 'bg-green-500 text-white' : 'bg-gray-200'
                    }`}>
                      {step.icon}
                    </div>
                    <p className={`mt-2 text-sm font-medium ${
                      index <= currentIndex ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {index < statusSteps.length - 1 && (
                      <div className={`absolute w-24 h-1 ${
                        index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                      }`} style={{transform: 'translateX(50%)', marginTop: '24px'}} />
                    )}
                  </div>
                ))}
              </div>

              {/* Order Details */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">לקוח:</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">טלפון:</span>
                  <span className="font-medium">{order.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">סוג הזמנה:</span>
                  <span className="font-medium">{order.order_type}</span>
                </div>
                {order.delivery_address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">כתובת:</span>
                    <span className="font-medium">{order.delivery_address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">תשלום:</span>
                  <span className="font-medium">{order.payment_method}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>סה"כ:</span>
                  <span className="text-green-600">₪{order.total}</span>
                </div>
              </div>

              {/* Status Message */}
              <Alert className="mt-6">
                <AlertDescription>
                  {order.status === 'נוצרה' && 'ההזמנה נתקבלה ועומדת בתור להכנה'}
                  {order.status === 'בהכנה' && 'ההזמנה כרגע בהכנה במטבח'}
                  {order.status === 'מוכן' && order.order_type === 'איסוף' && 'ההזמנה מוכנה לאיסוף!'}
                  {order.status === 'מוכן' && order.order_type === 'משלוח' && 'ההזמנה יצאה למשלוח ובדרכה אליך!'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full"
            variant="outline"
          >
            הזמנה חדשה
          </Button>
        </div>
      </main>
    </div>
  );
};

// Admin Panel Component
const AdminPanel = () => {
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  const authenticate = async () => {
    try {
      // Verify PIN by trying to update settings
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
        is_open: !settings.is_open
      });
      toast.success('סטטוס עודכן');
      fetchData();
    } catch (error) {
      toast.error('שגיאה בעדכון');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-sm mx-auto">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">כניסה למנהל</h2>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="קוד אדמין"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && authenticate()}
              />
              <Button 
                onClick={authenticate}
                className="w-full"
              >
                כניסה
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">פאנל ניהול - RS Burger</h1>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            לאתר
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>הגדרות מסעדה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-medium">סטטוס מסעדה:</span>
              <Button
                onClick={toggleOpen}
                className={settings?.is_open ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {settings?.is_open ? 'פתוח' : 'סגור'}
              </Button>
            </div>
            <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
              <div>טווח משלוח: {settings?.delivery_radius_km} ק"מ</div>
              <div>עלות משלוח: ₪{settings?.delivery_fee}</div>
              <div>מקסימום הזמנות: {settings?.max_parallel_orders}</div>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle>הזמנות ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">
                        {order.customer_name} - {order.customer_phone}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.order_type} | ₪{order.total} | {order.payment_method}
                      </p>
                      {order.delivery_address && (
                        <p className="text-sm text-gray-600">כתובת: {order.delivery_address}</p>
                      )}
                    </div>
                    <Badge className={
                      order.status === 'נוצרה' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'בהכנה' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    {order.items.map((item, index) => (
                      <div key={index}>
                        {item.product_name_he} 
                        {item.size && ` (${item.size})`}
                        {item.addons.length > 0 && ` + ${item.addons.map(a => a.name_he).join(', ')}`}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'נוצרה')}
                      disabled={order.status === 'נוצרה'}
                      variant="outline"
                    >
                      נוצרה
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'בהכנה')}
                      disabled={order.status === 'בהכנה'}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      בהכנה
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'מוכן')}
                      disabled={order.status === 'מוכן'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      מוכן
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// Wrap App with CartProvider
const AppWithProvider = () => (
  <CartProvider>
    <App />
  </CartProvider>
);

export default AppWithProvider;