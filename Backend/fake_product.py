import random
from faker import Faker
from pymongo import MongoClient
from datetime import datetime

fake = Faker()

client = MongoClient("mongodb://localhost:27017")
db = client["BuildDreamPC"]
products = db["products"]

BRANDS = {
    "cpu": ["AMD", "Intel"],
    "motherboard": ["ASUS", "MSI", "Gigabyte"],
    "ram": ["Corsair", "G.Skill", "Kingston"],
    "gpu": ["NVIDIA", "AMD"],
    "psu": ["Corsair", "Seasonic", "be quiet!"],
    "case": ["NZXT", "Fractal Design", "Lian Li"],
    "storage": ["Samsung", "WD", "Kingston"]
}

def cpu():
    socket = random.choice(["AM5", "LGA1700"])
    return {
        "socket": socket,
        "tdp": random.choice([65, 105, 120, 170]),
        "cores": random.choice([6, 8, 12, 16]),
        "threads": random.choice([12, 16, 24, 32]),
        "boost_clock": round(random.uniform(4.5, 5.8), 1)
    }

def motherboard():
    socket = random.choice(["AM5", "LGA1700"])
    ram_type = "DDR5"
    return {
        "socket": socket,
        "chipset": random.choice(["B650", "X670", "Z790"]),
        "form_factor": random.choice(["ATX", "mATX"]),
        "ram_type": ram_type,
        "ram_slots": random.choice([2, 4]),
        "max_ram_speed": random.choice([5600, 6000, 6400, 7200]),
        "pcie_slots": [{"type": "PCIe 5.0 x16", "count": 1}],
        "m2_slots": random.randint(1, 4)
    }

def ram():
    return {
        "ram_type": "DDR5",
        "speed": random.choice([5600, 6000, 6400]),
        "capacity": random.choice([8, 16, 32]),
        "voltage": round(random.uniform(1.25, 1.4), 2)
    }

def gpu():
    return {
        "length_mm": random.randint(250, 340),
        "power_draw": random.choice([200, 250, 300, 350]),
        "power_connectors": ["8pin", "8pin"],
        "recommended_psu": random.choice([650, 750, 850])
    }

def psu():
    return {
        "wattage": random.choice([650, 750, 850, 1000]),
        "efficiency": random.choice(["80+ Gold", "80+ Platinum"]),
        "modular": random.choice([True, False])
    }

def case():
    return {
        "supported_form_factors": ["ATX", "mATX", "ITX"],
        "gpu_max_length_mm": random.randint(300, 420),
        "psu_form_factor": "ATX"
    }

def storage():
    return {
        "type": "M.2",
        "protocol": "NVMe",
        "capacity": random.choice([500, 1000, 2000]),
        "speed_read": random.choice([3500, 5000, 7000])
    }

DETAIL_BUILDERS = {
    "cpu": cpu,
    "motherboard": motherboard,
    "ram": ram,
    "gpu": gpu,
    "psu": psu,
    "case": case,
    "storage": storage
}

POWER_DRAW = {
    "cpu": lambda d: d["tdp"],
    "gpu": lambda d: d["power_draw"],
    "motherboard": lambda _: random.randint(40, 70),
    "ram": lambda _: random.randint(5, 10),
    "storage": lambda _: random.randint(5, 8),
    "psu": lambda _: 0,
    "case": lambda _: 0
}


def generate_products(count=1000):
    docs = []

    for _ in range(count):
        product_type = random.choice(list(DETAIL_BUILDERS.keys()))
        details = DETAIL_BUILDERS[product_type]()

        doc = {
            "type": product_type,
            "brand": random.choice(BRANDS[product_type]),
            "model": fake.word().upper() + "-" + str(random.randint(100, 9999)),
            "details": details,
            "price": random.randint(200, 5000),
            "power_draw": POWER_DRAW[product_type](details),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        docs.append(doc)

    products.insert_many(docs)
    print(f"Inserted {count} products")

if __name__ == "__main__":
    generate_products(1000)
