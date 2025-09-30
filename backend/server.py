from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class ProductType(str, Enum):
    BUSINESS_MEAL = "business_meal"
    BURGER_ONLY = "burger_only"
    SIDE = "side"
    DRINK = "drink"
    ADDON = "addon"

class OrderStatus(str, Enum):
    CREATED = "נוצרה"
    IN_PREP = "בהכנה"
    READY = "מוכן"
    ON_THE_WAY = "בדרכו"
    COMPLETED = "הושלמה"

class OrderType(str, Enum):
    PICKUP = "איסוף"
    DELIVERY = "משלוח"

# Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_he: str
    type: ProductType
    price: float
    size: Optional[str] = None  # For burgers: 100g, 200g, etc.
    description_he: Optional[str] = None
    available: bool = True

class Addon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_he: str
    price: float = 8.0  # All extras are ₪8
    available: bool = True

class OrderItemAddon(BaseModel):
    addon_id: str
    name_he: str
    price: float

class OrderItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name_he: str
    product_type: ProductType
    size: Optional[str] = None
    quantity: int = 1
    base_price: float
    addons: List[OrderItemAddon] = []
    total_price: float

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_phone: str
    order_type: OrderType
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float = 0.0
    total: float
    status: OrderStatus = OrderStatus.CREATED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payment_method: str = "מזומן"  # Cash or Bit

class Settings(BaseModel):
    id: str = "restaurant_settings"
    is_open: bool = True
    delivery_radius_km: float = 10.0
    delivery_fee: float = 15.0
    max_parallel_orders: int = 20
    restaurant_location: Dict[str, float] = {"lat": 32.6947, "lng": 35.0319}  # Daliyat al-Karmel
    admin_pin: str = "1234"

# Create Models
class ProductCreate(BaseModel):
    name_he: str
    type: ProductType
    price: float
    size: Optional[str] = None
    description_he: Optional[str] = None

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    order_type: OrderType
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[Dict[str, Any]]  # Will be processed into OrderItem
    payment_method: str = "מזומן"

class SettingsUpdate(BaseModel):
    is_open: Optional[bool] = None
    delivery_radius_km: Optional[float] = None
    delivery_fee: Optional[float] = None
    max_parallel_orders: Optional[int] = None
    admin_pin: Optional[str] = None

# Helper Functions
def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lng1_rad = math.radians(lng1)
    lat2_rad = math.radians(lat2)
    lng2_rad = math.radians(lng2)
    
    dlat = lat2_rad - lat1_rad
    dlng = lng2_rad - lng1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def prepare_for_mongo(data: dict) -> dict:
    """Prepare data for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
    return data

def parse_from_mongo(item: dict) -> dict:
    """Parse data from MongoDB"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return item

# API Routes
@api_router.get("/")
async def root():
    return {"message": "RS Burger API"}

# Products
@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find().to_list(length=None)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_type}", response_model=List[Product])
async def get_products_by_type(product_type: ProductType):
    products = await db.products.find({"type": product_type}).to_list(length=None)
    return [Product(**product) for product in products]

# Addons
@api_router.get("/addons", response_model=List[Addon])
async def get_addons():
    addons = await db.addons.find().to_list(length=None)
    return [Addon(**addon) for addon in addons]

# Orders
@api_router.post("/orders", response_model=Order, status_code=201)
async def create_order(order_data: OrderCreate):
    # Check if restaurant is open
    settings = await db.settings.find_one({"id": "restaurant_settings"})
    if settings and not settings.get("is_open", True):
        raise HTTPException(status_code=400, detail="המסעדה סגורה כרגע")
    
    # Validate delivery address if needed
    if order_data.order_type == OrderType.DELIVERY:
        if not order_data.delivery_address:
            raise HTTPException(status_code=400, detail="כתובת משלוח נדרשת")
        
        # For MVP, we'll skip actual address validation and just check if address exists
        # In production, you'd use Google Maps API here
    
    # Process order items and calculate prices
    processed_items = []
    subtotal = 0.0
    
    for item_data in order_data.items:
        # Get product
        product = await db.products.find_one({"id": item_data["product_id"]})
        if not product:
            raise HTTPException(status_code=404, detail=f"מוצר לא נמצא: {item_data['product_id']}")
        
        # Calculate item price
        base_price = product["price"]
        addons_list = []
        addon_total = 0.0
        
        for addon_id in item_data.get("addon_ids", []):
            addon = await db.addons.find_one({"id": addon_id})
            if addon:
                addons_list.append(OrderItemAddon(
                    addon_id=addon_id,
                    name_he=addon["name_he"],
                    price=addon["price"]
                ))
                addon_total += addon["price"]
        
        item_total = (base_price + addon_total) * item_data.get("quantity", 1)
        
        order_item = OrderItem(
            product_id=item_data["product_id"],
            product_name_he=product["name_he"],
            product_type=product["type"],
            size=product.get("size"),
            quantity=item_data.get("quantity", 1),
            base_price=base_price,
            addons=addons_list,
            total_price=item_total
        )
        
        processed_items.append(order_item)
        subtotal += item_total
    
    # Calculate delivery fee
    delivery_fee = 0.0
    if order_data.order_type == OrderType.DELIVERY and settings:
        delivery_fee = settings.get("delivery_fee", 15.0)
    
    total = subtotal + delivery_fee
    
    # Create order
    order = Order(
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        order_type=order_data.order_type,
        delivery_address=order_data.delivery_address,
        notes=order_data.notes,
        items=processed_items,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        payment_method=order_data.payment_method
    )
    
    order_dict = prepare_for_mongo(order.dict())
    await db.orders.insert_one(order_dict)
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    orders = await db.orders.find().sort("created_at", -1).to_list(length=None)
    return [Order(**parse_from_mongo(order)) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
    return Order(**parse_from_mongo(order))

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: OrderStatus):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
    return {"message": "סטטוס עודכן בהצלחה"}

# Settings
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "restaurant_settings"})
    if not settings:
        # Create default settings
        default_settings = Settings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings
    return Settings(**settings)

@api_router.patch("/settings")
async def update_settings(settings_update: SettingsUpdate, admin_pin: str = Query(...)):
    # Verify admin PIN
    current_settings = await db.settings.find_one({"id": "restaurant_settings"})
    if not current_settings or current_settings.get("admin_pin", "1234") != admin_pin:
        raise HTTPException(status_code=401, detail="קוד אדמין שגוי")
    
    update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
    if update_data:
        await db.settings.update_one(
            {"id": "restaurant_settings"},
            {"$set": update_data}
        )
    
    return {"message": "הגדרות עודכנו בהצלחה"}

# Seed data function
@api_router.post("/seed")
async def seed_database():
    """Seed database with menu items and addons"""
    
    # Clear existing data
    await db.products.delete_many({})
    await db.addons.delete_many({})
    
    # Business meals
    business_meals = [
        {"name_he": "ארוחת עסקית 100 גרם", "type": ProductType.BUSINESS_MEAL, "price": 55, "size": "100g", "description_he": "כולל צ'יפס ושתייה"},
        {"name_he": "ארוחת עסקית 200 גרם", "type": ProductType.BUSINESS_MEAL, "price": 70, "size": "200g", "description_he": "כולל צ'יפס ושתייה"},
        {"name_he": "ארוחת עסקית 300 גרם", "type": ProductType.BUSINESS_MEAL, "price": 85, "size": "300g", "description_he": "כולל צ'יפס ושתייה"},
        {"name_he": "ארוחת עסקית 400 גרם", "type": ProductType.BUSINESS_MEAL, "price": 100, "size": "400g", "description_he": "כולל צ'יפס ושתייה"},
        {"name_he": "ארוחת עסקית 600 גרם", "type": ProductType.BUSINESS_MEAL, "price": 120, "size": "600g", "description_he": "כולל צ'יפס ושתייה"}
    ]
    
    # Burger only
    burger_only = [
        {"name_he": "בורגר 100 גרם", "type": ProductType.BURGER_ONLY, "price": 40, "size": "100g"},
        {"name_he": "בורגר 200 גרם", "type": ProductType.BURGER_ONLY, "price": 55, "size": "200g"},
        {"name_he": "בורגר 300 גרם", "type": ProductType.BURGER_ONLY, "price": 70, "size": "300g"},
        {"name_he": "בורגר 400 גרם", "type": ProductType.BURGER_ONLY, "price": 85, "size": "400g"},
        {"name_he": "בורגר 600 גרם", "type": ProductType.BURGER_ONLY, "price": 105, "size": "600g"}
    ]
    
    # Sides
    sides = [
        {"name_he": "צ'יפס", "type": ProductType.SIDE, "price": 25},
        {"name_he": "תוספת פריכה", "type": ProductType.SIDE, "price": 25}
    ]
    
    # Drinks
    drinks = [
        {"name_he": "קוקה קולה", "type": ProductType.DRINK, "price": 8},
        {"name_he": "קוקה קולה זירו", "type": ProductType.DRINK, "price": 8},
        {"name_he": "ספרייט", "type": ProductType.DRINK, "price": 8},
        {"name_he": "XL", "type": ProductType.DRINK, "price": 8},
        {"name_he": "טן", "type": ProductType.DRINK, "price": 8},
        {"name_he": "ענבים", "type": ProductType.DRINK, "price": 8},
        {"name_he": "תפוזים", "type": ProductType.DRINK, "price": 8},
        {"name_he": "מים", "type": ProductType.DRINK, "price": 8}
    ]
    
    # Create products
    all_products = business_meals + burger_only + sides + drinks
    products_to_insert = []
    
    for product_data in all_products:
        product = Product(**product_data)
        products_to_insert.append(product.dict())
    
    await db.products.insert_many(products_to_insert)
    
    # Addons (extras)
    addon_names = [
        "גבינת צ'דר",
        "גבינת גאודה", 
        "ביצה מטוגנת",
        "בצל מקורמל",
        "פטריות",
        "בצל מטוגן"
    ]
    
    addons_to_insert = []
    for addon_name in addon_names:
        addon = Addon(name_he=addon_name, price=8.0)
        addons_to_insert.append(addon.dict())
    
    await db.addons.insert_many(addons_to_insert)
    
    # Create default settings
    await db.settings.delete_many({"id": "restaurant_settings"})
    settings = Settings()
    await db.settings.insert_one(settings.dict())
    
    return {"message": "Database seeded successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()