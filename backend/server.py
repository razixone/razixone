from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, time
from enum import Enum
import math
import qrcode
from io import BytesIO
import base64
import json
import requests
from urllib.parse import quote

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
    WAITING = "ממתינה"
    IN_PREP = "בהכנה"
    READY = "מוכן"
    ON_THE_WAY = "בדרכו"
    COMPLETED = "הושלמה"

class OrderType(str, Enum):
    PICKUP = "איסוף"
    DELIVERY = "משלוח"

class PaymentMethod(str, Enum):
    CASH = "מזומן"
    BIT = "Bit"
    CREDIT_CARD = "כרטיס אשראי"

class DayOfWeek(str, Enum):
    SUNDAY = "ראשון"
    MONDAY = "שני"
    TUESDAY = "שלישי"
    WEDNESDAY = "רביעי"
    THURSDAY = "חמישי"
    FRIDAY = "שישי"
    SATURDAY = "שבת"

# Enhanced Models with Salads, Sauces, and Delivery Zones
class Salad(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_he: str
    available: bool = True

class Sauce(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_he: str
    available: bool = True

class DeliveryZone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_he: str
    radius_km: float
    delivery_fee: float
    active: bool = True

class Coupon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_percent: Optional[float] = None
    discount_amount: Optional[float] = None
    min_order_amount: float = 0.0
    active: bool = True
    expires_at: Optional[datetime] = None
    max_uses: Optional[int] = None
    current_uses: int = 0

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_he: str
    type: ProductType
    price: float
    size: Optional[str] = None
    description_he: Optional[str] = None
    image_url: Optional[str] = None
    available: bool = True

class Addon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_he: str
    price: float = 8.0
    available: bool = True

class LoyaltyAccount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Optional[EmailStr] = None
    phone: str
    name: str
    points: float = 0.0
    total_spent: float = 0.0
    orders_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_phone: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    comment: str
    order_id: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved: bool = False

class BlogPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title_he: str
    content_he: str
    summary_he: Optional[str] = None
    image_url: Optional[str] = None
    published: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Campaign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title_he: str
    content_he: str
    image_url: Optional[str] = None
    banner_color: str = "#FFD700"
    active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OpeningHours(BaseModel):
    day: DayOfWeek
    is_open: bool = True
    open_time: Optional[str] = "10:00"  # HH:MM format
    close_time: Optional[str] = "22:00"  # HH:MM format

class OrderItemAddon(BaseModel):
    addon_id: str
    name_he: str
    price: float

class OrderItemSalad(BaseModel):
    salad_id: str
    name_he: str

class OrderItemSauce(BaseModel):
    sauce_id: str
    name_he: str

class OrderItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name_he: str
    product_type: ProductType
    size: Optional[str] = None
    quantity: int = 1
    base_price: float
    addons: List[OrderItemAddon] = []
    salads: List[OrderItemSalad] = []
    sauces: List[OrderItemSauce] = []
    salad_option: Optional[str] = None  # "all", "dry", or "custom"
    total_price: float

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    loyalty_account_id: Optional[str] = None
    order_type: OrderType
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float = 0.0
    discount: float = 0.0
    loyalty_points_used: float = 0.0
    loyalty_points_earned: float = 0.0
    total: float
    status: OrderStatus = OrderStatus.CREATED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payment_method: PaymentMethod = PaymentMethod.CASH
    payment_status: str = "pending"

class Settings(BaseModel):
    id: str = "restaurant_settings"
    is_open: bool = True
    manual_override: bool = False  # Admin can manually override hours
    delivery_radius_km: float = 10.0
    delivery_fee: float = 15.0
    max_parallel_orders: int = 20
    current_orders_count: int = 0
    waiting_queue_enabled: bool = True
    loyalty_points_rate: float = 0.1  # 10% back in points
    restaurant_location: Dict[str, float] = {"lat": 32.6969, "lng": 35.0297}  # Al-Okif Gas Station, Daliyat al-Karmel
    admin_pin: str = "1234"
    instagram_handle: str = "rs_burger1"
    opening_hours: List[OpeningHours] = Field(default_factory=lambda: [
        OpeningHours(day=DayOfWeek.SUNDAY, is_open=True, open_time="10:00", close_time="22:00"),
        OpeningHours(day=DayOfWeek.MONDAY, is_open=True, open_time="10:00", close_time="22:00"),
        OpeningHours(day=DayOfWeek.TUESDAY, is_open=True, open_time="10:00", close_time="22:00"),
        OpeningHours(day=DayOfWeek.WEDNESDAY, is_open=True, open_time="10:00", close_time="22:00"),
        OpeningHours(day=DayOfWeek.THURSDAY, is_open=True, open_time="10:00", close_time="22:00"),
        OpeningHours(day=DayOfWeek.FRIDAY, is_open=True, open_time="10:00", close_time="15:00"),
        OpeningHours(day=DayOfWeek.SATURDAY, is_open=False)
    ])

# Create Models
class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    loyalty_account_id: Optional[str] = None
    order_type: OrderType
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[Dict[str, Any]]
    payment_method: PaymentMethod = PaymentMethod.CASH
    loyalty_points_used: float = 0.0

class ReviewCreate(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    comment: str
    order_id: Optional[str] = None

class BlogPostCreate(BaseModel):
    title_he: str
    content_he: str
    summary_he: Optional[str] = None
    published: bool = False

class CampaignCreate(BaseModel):
    title_he: str
    content_he: str
    banner_color: str = "#FFD700"
    active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class LoyaltyAccountCreate(BaseModel):
    phone: str
    name: str
    email: Optional[EmailStr] = None

# Helper Functions
def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
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
    for key, value in data.items():
        if isinstance(value, datetime):
            data[key] = value.isoformat()
    return data

def parse_from_mongo(item: dict) -> dict:
    for key, value in item.items():
        if isinstance(value, str) and 'T' in value:
            try:
                item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except:
                pass
    return item

async def is_restaurant_open() -> bool:
    """Check if restaurant is currently open based on schedule"""
    settings = await db.settings.find_one({"id": "restaurant_settings"})
    if not settings:
        return True
    
    if settings.get("manual_override", False):
        return settings.get("is_open", True)
    
    # Check opening hours
    now = datetime.now()
    current_day = now.strftime("%A")  # Get day name
    current_time = now.strftime("%H:%M")
    
    # Map English day names to Hebrew enum
    day_mapping = {
        "Sunday": DayOfWeek.SUNDAY, "Monday": DayOfWeek.MONDAY,
        "Tuesday": DayOfWeek.TUESDAY, "Wednesday": DayOfWeek.WEDNESDAY,
        "Thursday": DayOfWeek.THURSDAY, "Friday": DayOfWeek.FRIDAY,
        "Saturday": DayOfWeek.SATURDAY
    }
    
    current_day_he = day_mapping.get(current_day)
    opening_hours = settings.get("opening_hours", [])
    
    for hours in opening_hours:
        if hours.get("day") == current_day_he:
            if not hours.get("is_open", False):
                return False
            open_time = hours.get("open_time", "10:00")
            close_time = hours.get("close_time", "22:00")
            return open_time <= current_time <= close_time
    
    return True

# API Routes
@api_router.get("/")
async def root():
    return {"message": "RS Burger Premium API", "version": "2.0"}

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

# Loyalty Program
@api_router.post("/loyalty/register", response_model=LoyaltyAccount)
async def register_loyalty_account(account_data: LoyaltyAccountCreate):
    # Check if phone already exists
    existing = await db.loyalty_accounts.find_one({"phone": account_data.phone})
    if existing:
        raise HTTPException(status_code=400, detail="מספר טלפון כבר רשום במערכת")
    
    account = LoyaltyAccount(**account_data.dict())
    account_dict = prepare_for_mongo(account.dict())
    await db.loyalty_accounts.insert_one(account_dict)
    return account

@api_router.get("/loyalty/{phone}", response_model=LoyaltyAccount)
async def get_loyalty_account(phone: str):
    account = await db.loyalty_accounts.find_one({"phone": phone})
    if not account:
        raise HTTPException(status_code=404, detail="חשבון לא נמצא")
    return LoyaltyAccount(**parse_from_mongo(account))

# Reviews
@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate):
    review = Review(**review_data.dict())
    review_dict = prepare_for_mongo(review.dict())
    await db.reviews.insert_one(review_dict)
    return review

@api_router.get("/reviews", response_model=List[Review])
async def get_approved_reviews():
    reviews = await db.reviews.find({"approved": True}).sort("created_at", -1).to_list(length=20)
    return [Review(**parse_from_mongo(review)) for review in reviews]

# Blog
@api_router.get("/blog", response_model=List[BlogPost])
async def get_published_posts():
    posts = await db.blog_posts.find({"published": True}).sort("created_at", -1).to_list(length=10)
    return [BlogPost(**parse_from_mongo(post)) for post in posts]

@api_router.get("/blog/{post_id}", response_model=BlogPost)
async def get_blog_post(post_id: str):
    post = await db.blog_posts.find_one({"id": post_id, "published": True})
    if not post:
        raise HTTPException(status_code=404, detail="פוסט לא נמצא")
    return BlogPost(**parse_from_mongo(post))

# Campaigns
@api_router.get("/campaigns", response_model=List[Campaign])
async def get_active_campaigns():
    now = datetime.now(timezone.utc).isoformat()
    campaigns = await db.campaigns.find({
        "active": True,
        "$or": [
            {"end_date": None},
            {"end_date": {"$gte": now}}
        ]
    }).sort("created_at", -1).to_list(length=5)
    return [Campaign(**parse_from_mongo(campaign)) for campaign in campaigns]

# Instagram Integration
@api_router.get("/instagram/posts")
async def get_instagram_posts():
    """Fetch Instagram posts - placeholder implementation"""
    # In production, this would use Instagram Basic Display API
    # For now, return mock data
    mock_posts = [
        {
            "id": "1",
            "caption": "🍔 בורגר פרימיום עם בייקון פריך! #RSBurger #המבורגר",
            "media_url": "/api/placeholder/burger1.jpg",
            "permalink": f"https://instagram.com/rs_burger1/p/post1",
            "timestamp": "2024-01-15T10:30:00Z"
        },
        {
            "id": "2", 
            "caption": "📍 דאלית אל כרמל - בואו לטעום! #פוד_טראק #דאלית",
            "media_url": "/api/placeholder/truck.jpg",
            "permalink": f"https://instagram.com/rs_burger1/p/post2",
            "timestamp": "2024-01-14T15:20:00Z"
        },
        {
            "id": "3",
            "caption": "🔥 מבצע שישי - 20% הנחה על ארוחות עסקיות!",
            "media_url": "/api/placeholder/deal.jpg", 
            "permalink": f"https://instagram.com/rs_burger1/p/post3",
            "timestamp": "2024-01-12T12:00:00Z"
        }
    ]
    return {"data": mock_posts}

# Orders (Enhanced)
@api_router.post("/orders", response_model=Order, status_code=201)
async def create_order(order_data: OrderCreate):
    # Check if restaurant is open
    if not await is_restaurant_open():
        raise HTTPException(status_code=400, detail="המסעדה סגורה כרגע")
    
    settings = await db.settings.find_one({"id": "restaurant_settings"})
    if settings:
        current_orders = settings.get("current_orders_count", 0)
        max_orders = settings.get("max_parallel_orders", 20)
        
        if current_orders >= max_orders:
            if not settings.get("waiting_queue_enabled", True):
                raise HTTPException(status_code=400, detail="יש עומס, נסה שוב מאוחר יותר")
    
    # Process order items and calculate prices
    processed_items = []
    subtotal = 0.0
    
    for item_data in order_data.items:
        product = await db.products.find_one({"id": item_data["product_id"]})
        if not product:
            raise HTTPException(status_code=404, detail=f"מוצר לא נמצא: {item_data['product_id']}")
        
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
    
    # Handle loyalty points
    discount = 0.0
    loyalty_points_earned = 0.0
    loyalty_account = None
    
    if order_data.loyalty_account_id:
        loyalty_account = await db.loyalty_accounts.find_one({"id": order_data.loyalty_account_id})
        if loyalty_account:
            # Apply loyalty points discount
            if order_data.loyalty_points_used > 0:
                max_points = min(loyalty_account["points"], subtotal * 0.5)  # Max 50% discount
                points_to_use = min(order_data.loyalty_points_used, max_points)
                discount = points_to_use
            
            # Calculate points earned (10% of total)
            loyalty_points_earned = (subtotal + delivery_fee - discount) * settings.get("loyalty_points_rate", 0.1)
    
    total = subtotal + delivery_fee - discount
    
    # Determine initial status
    initial_status = OrderStatus.CREATED
    if settings and settings.get("current_orders_count", 0) >= settings.get("max_parallel_orders", 20):
        initial_status = OrderStatus.WAITING
    
    # Create order
    order = Order(
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        customer_email=order_data.customer_email,
        loyalty_account_id=order_data.loyalty_account_id,
        order_type=order_data.order_type,
        delivery_address=order_data.delivery_address,
        notes=order_data.notes,
        items=processed_items,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        discount=discount,
        loyalty_points_used=order_data.loyalty_points_used,
        loyalty_points_earned=loyalty_points_earned,
        total=total,
        payment_method=order_data.payment_method,
        status=initial_status
    )
    
    order_dict = prepare_for_mongo(order.dict())
    await db.orders.insert_one(order_dict)
    
    # Update loyalty account
    if loyalty_account:
        await db.loyalty_accounts.update_one(
            {"id": order_data.loyalty_account_id},
            {"$set": {
                "points": loyalty_account["points"] - order_data.loyalty_points_used + loyalty_points_earned,
                "total_spent": loyalty_account["total_spent"] + total,
                "orders_count": loyalty_account["orders_count"] + 1
            }}
        )
    
    # Update current orders count
    if settings:
        await db.settings.update_one(
            {"id": "restaurant_settings"},
            {"$set": {"current_orders_count": settings.get("current_orders_count", 0) + 1}}
        )
    
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
    
    # Update current orders count if order completed
    if status in [OrderStatus.COMPLETED]:
        settings = await db.settings.find_one({"id": "restaurant_settings"})
        if settings:
            current_count = max(0, settings.get("current_orders_count", 0) - 1)
            await db.settings.update_one(
                {"id": "restaurant_settings"},
                {"$set": {"current_orders_count": current_count}}
            )
    
    return {"message": "סטטוס עודכן בהצלחה"}

# Enhanced Settings
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "restaurant_settings"})
    if not settings:
        default_settings = Settings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings
    return Settings(**settings)

@api_router.patch("/settings")
async def update_settings(settings_update: dict, admin_pin: str = Query(...)):
    current_settings = await db.settings.find_one({"id": "restaurant_settings"})
    if not current_settings or current_settings.get("admin_pin", "1234") != admin_pin:
        raise HTTPException(status_code=401, detail="קוד אדמין שגוי")
    
    update_data = {k: v for k, v in settings_update.items() if v is not None}
    if update_data:
        await db.settings.update_one(
            {"id": "restaurant_settings"},
            {"$set": update_data}
        )
    
    return {"message": "הגדרות עודכנו בהצלחה"}

# Admin Routes
@api_router.post("/admin/blog", response_model=BlogPost)
async def create_blog_post(post_data: BlogPostCreate, admin_pin: str = Query(...)):
    await verify_admin_pin(admin_pin)
    post = BlogPost(**post_data.dict())
    post_dict = prepare_for_mongo(post.dict())
    await db.blog_posts.insert_one(post_dict)
    return post

@api_router.post("/admin/campaigns", response_model=Campaign)
async def create_campaign(campaign_data: CampaignCreate, admin_pin: str = Query(...)):
    await verify_admin_pin(admin_pin)
    campaign = Campaign(**campaign_data.dict())
    campaign_dict = prepare_for_mongo(campaign.dict())
    await db.campaigns.insert_one(campaign_dict)
    return campaign

@api_router.patch("/admin/reviews/{review_id}/approve")
async def approve_review(review_id: str, admin_pin: str = Query(...)):
    await verify_admin_pin(admin_pin)
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"approved": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="חוות דעת לא נמצאה")
    return {"message": "חוות דעת אושרה"}

@api_router.get("/admin/qr-code")
async def generate_qr_code(admin_pin: str = Query(...)):
    await verify_admin_pin(admin_pin)
    
    # Generate QR code for restaurant website
    website_url = "https://rs-burger.com"  # Replace with actual domain
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(website_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "qr_code_base64": f"data:image/png;base64,{img_str}",
        "url": website_url,
        "label": "סרוק להזמנה"
    }

@api_router.get("/admin/reports/daily")
async def get_daily_report(date: str, admin_pin: str = Query(...)):
    await verify_admin_pin(admin_pin)
    
    # Parse date and create date range
    try:
        report_date = datetime.fromisoformat(date).date()
        start_datetime = datetime.combine(report_date, time.min).isoformat()
        end_datetime = datetime.combine(report_date, time.max).isoformat()
    except:
        raise HTTPException(status_code=400, detail="פורמט תאריך שגוי")
    
    # Get orders for the day
    orders = await db.orders.find({
        "created_at": {
            "$gte": start_datetime,
            "$lte": end_datetime
        }
    }).to_list(length=None)
    
    # Calculate statistics
    total_orders = len(orders)
    total_revenue = sum(order["total"] for order in orders)
    pickup_orders = len([o for o in orders if o["order_type"] == OrderType.PICKUP])
    delivery_orders = len([o for o in orders if o["order_type"] == OrderType.DELIVERY])
    
    # Group by status
    status_counts = {}
    for order in orders:
        status = order["status"]
        status_counts[status] = status_counts.get(status, 0) + 1
    
    report = {
        "date": date,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "pickup_orders": pickup_orders,
        "delivery_orders": delivery_orders,
        "status_breakdown": status_counts,
        "orders": orders
    }
    
    return report

async def verify_admin_pin(pin: str):
    settings = await db.settings.find_one({"id": "restaurant_settings"})
    if not settings or settings.get("admin_pin", "1234") != pin:
        raise HTTPException(status_code=401, detail="קוד אדמין שגוי")

# Placeholder routes for images
@api_router.get("/placeholder/{image_name}")
async def get_placeholder_image(image_name: str):
    # Return placeholder image data
    return {"message": f"Placeholder for {image_name}", "note": "Replace with actual image"}

# Seed data function (Enhanced)
@api_router.post("/seed")
async def seed_database():
    """Seed database with enhanced data including reviews, blog posts, campaigns"""
    
    # Clear existing data
    await db.products.delete_many({})
    await db.addons.delete_many({})
    await db.reviews.delete_many({})
    await db.blog_posts.delete_many({})
    await db.campaigns.delete_many({})
    
    # Business meals
    business_meals = [
        {"name_he": "ארוחת עסקית 100 גרם", "type": ProductType.BUSINESS_MEAL, "price": 55, "size": "100g", 
         "description_he": "כולל צ'יפס ושתייה", "image_url": "/api/placeholder/business_100g.jpg"},
        {"name_he": "ארוחת עסקית 200 גרם", "type": ProductType.BUSINESS_MEAL, "price": 70, "size": "200g", 
         "description_he": "כולל צ'יפס ושתייה", "image_url": "/api/placeholder/business_200g.jpg"},
        {"name_he": "ארוחת עסקית 300 גרם", "type": ProductType.BUSINESS_MEAL, "price": 85, "size": "300g", 
         "description_he": "כולל צ'יפס ושתייה", "image_url": "/api/placeholder/business_300g.jpg"},
        {"name_he": "ארוחת עסקית 400 גרם", "type": ProductType.BUSINESS_MEAL, "price": 100, "size": "400g", 
         "description_he": "כולל צ'יפס ושתייה", "image_url": "/api/placeholder/business_400g.jpg"},
        {"name_he": "ארוחת עסקית 600 גרם", "type": ProductType.BUSINESS_MEAL, "price": 120, "size": "600g", 
         "description_he": "כולל צ'יפס ושתייה", "image_url": "/api/placeholder/business_600g.jpg"}
    ]
    
    # Burger only
    burger_only = [
        {"name_he": "בורגר 100 גרם", "type": ProductType.BURGER_ONLY, "price": 40, "size": "100g", 
         "image_url": "/api/placeholder/burger_100g.jpg"},
        {"name_he": "בורגר 200 גרם", "type": ProductType.BURGER_ONLY, "price": 55, "size": "200g", 
         "image_url": "/api/placeholder/burger_200g.jpg"},
        {"name_he": "בורגר 300 גרם", "type": ProductType.BURGER_ONLY, "price": 70, "size": "300g", 
         "image_url": "/api/placeholder/burger_300g.jpg"},
        {"name_he": "בורגר 400 גרם", "type": ProductType.BURGER_ONLY, "price": 85, "size": "400g", 
         "image_url": "/api/placeholder/burger_400g.jpg"},
        {"name_he": "בורגר 600 גרם", "type": ProductType.BURGER_ONLY, "price": 105, "size": "600g", 
         "image_url": "/api/placeholder/burger_600g.jpg"}
    ]
    
    # Sides
    sides = [
        {"name_he": "צ'יפס", "type": ProductType.SIDE, "price": 25, "image_url": "/api/placeholder/fries.jpg"},
        {"name_he": "תוספת פריכה", "type": ProductType.SIDE, "price": 25, "image_url": "/api/placeholder/crispy.jpg"}
    ]
    
    # Drinks
    drinks = [
        {"name_he": "קוקה קולה", "type": ProductType.DRINK, "price": 8, "image_url": "/api/placeholder/cola.jpg"},
        {"name_he": "קוקה קולה זירו", "type": ProductType.DRINK, "price": 8, "image_url": "/api/placeholder/cola_zero.jpg"},
        {"name_he": "ספרייט", "type": ProductType.DRINK, "price": 8, "image_url": "/api/placeholder/sprite.jpg"},
        {"name_he": "XL", "type": ProductType.DRINK, "price": 8, "image_url": "/api/placeholder/xl.jpg"},
        {"name_he": "טן", "type": ProductType.DRINK, "price": 8, "image_url": "/api/placeholder/ten.jpg"},
        {"name_he": "ענבים", "type": ProductType.DRINK, "price": 8, "image_url": "/api/placeholder/grape.jpg"},
        {"name_he": "תפוזים", "type": ProductType.DRINK, "price": 8, "image_url": "/api/placeholder/orange.jpg"},
        {"name_he": "מים", "type": ProductType.DRINK, "price": 8, "image_url": "/api/placeholder/water.jpg"}
    ]
    
    # Create products
    all_products = business_meals + burger_only + sides + drinks
    products_to_insert = []
    
    for product_data in all_products:
        product = Product(**product_data)
        products_to_insert.append(product.dict())
    
    await db.products.insert_many(products_to_insert)
    
    # Addons
    addon_names = [
        "גבינת צ'דר", "גבינת גאודה", "ביצה מטוגנת",
        "בצל מקורמל", "פטריות", "בצל מטוגן"
    ]
    
    addons_to_insert = []
    for addon_name in addon_names:
        addon = Addon(name_he=addon_name, price=8.0)
        addons_to_insert.append(addon.dict())
    
    await db.addons.insert_many(addons_to_insert)
    
    # Sample reviews
    sample_reviews = [
        Review(customer_name="דוד כהן", rating=5, comment="הבורגר הכי טעים שאכלתי! שירות מעולה", approved=True),
        Review(customer_name="שרה לוי", rating=5, comment="ארוחה עסקית מושלמת, מחיר הוגן וטעם נהדר", approved=True),
        Review(customer_name="יוסי אברהם", rating=4, comment="המקום הכי טוב בדאלית! חוזרים בקרוב", approved=True),
        Review(customer_name="מירי רוזן", rating=5, comment="פוד טרק ברמה גבוהה, ממליצה בחום!", approved=True)
    ]
    
    for review in sample_reviews:
        await db.reviews.insert_one(prepare_for_mongo(review.dict()))
    
    # Sample blog posts
    sample_posts = [
        BlogPost(
            title_he="ברוכים הבאים ל-RS Burger!",
            content_he="אנחנו גאים להציג את RS Burger - המבורגריה הנודדת החדשה של דאלית אל כרמל. בשר איכותי, לחמניות טריות ושירות מעולה!",
            summary_he="פתיחת RS Burger החדש בדאלית אל כרמל",
            published=True,
            image_url="/api/placeholder/blog_opening.jpg"
        ),
        BlogPost(
            title_he="מבצעי סוף השבוע",
            content_he="כל סוף שבוע ב-RS Burger - מבצעים מיוחדים על ארוחות עסקיות! בואו ליהנות מהמבורגרים הכי טעימים באזור.",
            summary_he="מבצעי סוף שבוע מיוחדים",
            published=True,
            image_url="/api/placeholder/blog_weekend.jpg"
        )
    ]
    
    for post in sample_posts:
        await db.blog_posts.insert_one(prepare_for_mongo(post.dict()))
    
    # Sample campaigns
    sample_campaigns = [
        Campaign(
            title_he="מבצע שישי!",
            content_he="20% הנחה על כל הארוחות העסקיות בימי שישי",
            banner_color="#FFD700",
            active=True,
            image_url="/api/placeholder/friday_deal.jpg"
        )
    ]
    
    for campaign in sample_campaigns:
        await db.campaigns.insert_one(prepare_for_mongo(campaign.dict()))
    
    # Enhanced settings
    await db.settings.delete_many({"id": "restaurant_settings"})
    settings = Settings()
    await db.settings.insert_one(settings.dict())
    
    return {"message": "Premium database seeded successfully"}

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