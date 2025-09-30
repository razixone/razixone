#!/usr/bin/env python3
"""
RS Burger Backend API Testing Script
Tests all API endpoints for the Hebrew RTL food truck app
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, List

class RSBurgerAPITester:
    def __init__(self, base_url="https://burger-express-16.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_pin = "1234"  # Default admin PIN
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict = None, params: Dict = None) -> tuple:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, params=params, timeout=10)
            else:
                self.log_test(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_test(name, True, f"Status: {response.status_code}")
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}")

            return success, response_data

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_seed_database(self):
        """Test database seeding"""
        return self.run_test("Seed Database", "POST", "seed", 200)

    def test_get_products(self):
        """Test getting all products"""
        return self.run_test("Get All Products", "GET", "products", 200)

    def test_get_business_meals(self):
        """Test getting business meals"""
        return self.run_test("Get Business Meals", "GET", "products/business_meal", 200)

    def test_get_burger_only(self):
        """Test getting burger only products"""
        return self.run_test("Get Burger Only", "GET", "products/burger_only", 200)

    def test_get_sides(self):
        """Test getting sides"""
        return self.run_test("Get Sides", "GET", "products/side", 200)

    def test_get_drinks(self):
        """Test getting drinks"""
        return self.run_test("Get Drinks", "GET", "products/drink", 200)

    def test_get_addons(self):
        """Test getting addons"""
        return self.run_test("Get Addons", "GET", "addons", 200)

    def test_get_settings(self):
        """Test getting restaurant settings"""
        return self.run_test("Get Settings", "GET", "settings", 200)

    def test_create_order(self):
        """Test creating an order"""
        order_data = {
            "customer_name": "בדיקה טסט",
            "customer_phone": "050-1234567",
            "order_type": "איסוף",
            "notes": "בדיקה אוטומטית",
            "items": [
                {
                    "product_id": "test-product-id",
                    "quantity": 1,
                    "addon_ids": []
                }
            ],
            "payment_method": "מזומן"
        }
        
        # First get a real product ID
        success, products = self.run_test("Get Products for Order Test", "GET", "products", 200)
        if success and products and len(products) > 0:
            order_data["items"][0]["product_id"] = products[0]["id"]
            return self.run_test("Create Order", "POST", "orders", 201, order_data)
        else:
            self.log_test("Create Order", False, "No products available to create order")
            return False, {}

    def test_get_orders(self):
        """Test getting all orders"""
        return self.run_test("Get All Orders", "GET", "orders", 200)

    def test_update_settings(self):
        """Test updating restaurant settings"""
        settings_data = {"is_open": True}
        return self.run_test("Update Settings", "PATCH", "settings", 200, 
                           settings_data, {"admin_pin": self.admin_pin})

    def test_invalid_admin_pin(self):
        """Test invalid admin PIN"""
        settings_data = {"is_open": False}
        return self.run_test("Invalid Admin PIN", "PATCH", "settings", 401, 
                           settings_data, {"admin_pin": "wrong_pin"})

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting RS Burger API Tests...")
        print(f"🔗 Testing API at: {self.api_url}")
        print("=" * 60)

        # Test basic connectivity
        self.test_root_endpoint()
        
        # Seed database first
        self.test_seed_database()
        
        # Test product endpoints
        self.test_get_products()
        self.test_get_business_meals()
        self.test_get_burger_only()
        self.test_get_sides()
        self.test_get_drinks()
        self.test_get_addons()
        
        # Test settings
        self.test_get_settings()
        self.test_update_settings()
        self.test_invalid_admin_pin()
        
        # Test orders
        self.test_create_order()
        self.test_get_orders()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

    def get_test_report(self):
        """Get detailed test report"""
        return {
            "summary": f"Backend API testing completed. {self.tests_passed}/{self.tests_run} tests passed.",
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run)*100 if self.tests_run > 0 else 0,
            "test_results": self.test_results,
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Main test execution"""
    tester = RSBurgerAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save test report
        report = tester.get_test_report()
        with open('/app/backend_test_report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"\n📄 Test report saved to: /app/backend_test_report.json")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())