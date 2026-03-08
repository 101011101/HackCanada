from datetime import date
from .schemas import FarmNode, Crop, HubNode, NetworkConfig

# ---------------------------------------------------------------------------
# CROPS  (id 0–9)
# ---------------------------------------------------------------------------
crops = [
    Crop(id=0, name='Tomato',       color='#e74c3c',
         min_sqft=10,  tool_requirement='basic',        budget_requirement='low',
         optimal_pH=(6.0, 7.0), optimal_moisture=(60, 80), optimal_temp=(18, 27),
         base_yield_per_sqft=2.5,  grow_weeks=10, network_target_share=0.15),

    Crop(id=1, name='Lettuce',      color='#2ecc71',
         min_sqft=4,   tool_requirement='basic',        budget_requirement='low',
         optimal_pH=(6.0, 7.0), optimal_moisture=(60, 80), optimal_temp=(15, 22),
         base_yield_per_sqft=1.5,  grow_weeks=4,  network_target_share=0.15),

    Crop(id=2, name='Spinach',      color='#27ae60',
         min_sqft=4,   tool_requirement='basic',        budget_requirement='low',
         optimal_pH=(6.0, 7.5), optimal_moisture=(55, 75), optimal_temp=(10, 20),
         base_yield_per_sqft=1.2,  grow_weeks=4,  network_target_share=0.10),

    Crop(id=3, name='Herbs',        color='#1abc9c',
         min_sqft=2,   tool_requirement='basic',        budget_requirement='low',
         optimal_pH=(6.0, 7.0), optimal_moisture=(40, 60), optimal_temp=(18, 28),
         base_yield_per_sqft=0.8,  grow_weeks=6,  network_target_share=0.10),

    Crop(id=4, name='Carrots',      color='#e67e22',
         min_sqft=6,   tool_requirement='basic',        budget_requirement='low',
         optimal_pH=(6.0, 6.8), optimal_moisture=(50, 70), optimal_temp=(15, 22),
         base_yield_per_sqft=2.0,  grow_weeks=10, network_target_share=0.10),

    Crop(id=5, name='Kale',         color='#16a085',
         min_sqft=4,   tool_requirement='basic',        budget_requirement='low',
         optimal_pH=(6.0, 7.0), optimal_moisture=(55, 75), optimal_temp=(10, 22),
         base_yield_per_sqft=1.3,  grow_weeks=6,  network_target_share=0.10),

    Crop(id=6, name='Peppers',      color='#e74c3c',
         min_sqft=8,   tool_requirement='intermediate', budget_requirement='low',
         optimal_pH=(6.0, 6.8), optimal_moisture=(55, 75), optimal_temp=(20, 30),
         base_yield_per_sqft=1.8,  grow_weeks=12, network_target_share=0.10),

    Crop(id=7, name='Microgreens',  color='#f1c40f',
         min_sqft=2,   tool_requirement='basic',        budget_requirement='low',
         optimal_pH=(6.0, 7.0), optimal_moisture=(60, 80), optimal_temp=(18, 25),
         base_yield_per_sqft=0.5,  grow_weeks=2,  network_target_share=0.10),

    Crop(id=8, name='Strawberries', color='#e91e63',
         min_sqft=6,   tool_requirement='intermediate', budget_requirement='medium',
         optimal_pH=(5.5, 6.5), optimal_moisture=(60, 80), optimal_temp=(15, 22),
         base_yield_per_sqft=1.5,  grow_weeks=8,  network_target_share=0.05),

    Crop(id=9, name='Beans',        color='#8bc34a',
         min_sqft=6,   tool_requirement='basic',        budget_requirement='low',
         optimal_pH=(6.0, 7.0), optimal_moisture=(50, 70), optimal_temp=(18, 27),
         base_yield_per_sqft=1.0,  grow_weeks=8,  network_target_share=0.05),
]

# ---------------------------------------------------------------------------
# HUBS  — clustered around Toronto (43.65, -79.38)
# Hub 0 = critical (downtown school), Hub 1 & 2 = standard
# ---------------------------------------------------------------------------
hubs = [
    HubNode(id=0, name='Greenwood Public School', lat=43.6532, lng=-79.3832,
            priority='critical', capacity_kg=500.0,
            local_demand={0:30, 1:25, 2:20, 3:15, 4:20, 5:20, 6:15, 7:15, 8:10, 9:10}),

    HubNode(id=1, name='North Community Centre',  lat=43.6700, lng=-79.4000,
            priority='standard', capacity_kg=300.0,
            local_demand={0:15, 1:12, 2:10, 3:8,  4:10, 5:10, 6:8,  7:8,  8:5,  9:5}),

    HubNode(id=2, name='East Neighbourhood Hub',  lat=43.6400, lng=-79.3600,
            priority='standard', capacity_kg=300.0,
            local_demand={0:15, 1:12, 2:10, 3:8,  4:10, 5:10, 6:8,  7:8,  8:5,  9:5}),
]

# ---------------------------------------------------------------------------
# NETWORK CONFIG
# ---------------------------------------------------------------------------
config = NetworkConfig(
    max_travel_distance=5000.0,    # 5 km
    food_targets={
        0: 1200,   # Tomato
        1: 600,    # Lettuce
        2: 400,    # Spinach
        3: 150,    # Herbs
        4: 350,    # Carrots
        5: 200,    # Kale
        6: 150,    # Peppers
        7: 60,     # Microgreens
        8: 100,    # Strawberries
        9: 200,    # Beans
    },
    epoch_weeks=4,
    inertia_weight=50.0,
    overproduction_buffer=0.20,
)

# ---------------------------------------------------------------------------
# FARMS  (20 nodes, clustered within 5 km of at least one hub)
# 8 locked (status='growing'), 12 available/new
# ---------------------------------------------------------------------------
farms = [
    # ── AVAILABLE / NEW ──────────────────────────────────────────────────────
    FarmNode(id=0,  name='Farm #01 — Balcony',
             lat=43.6520, lng=-79.3820, plot_size_sqft=25,
             plot_type='balcony',   tools='basic',        budget='low',
             pH=6.5, moisture=65, temperature=22, humidity=65,
             status='available'),

    FarmNode(id=2,  name='Farm #03 — Backyard',
             lat=43.6490, lng=-79.3750, plot_size_sqft=120,
             plot_type='backyard',  tools='basic',        budget='low',
             pH=6.2, moisture=58, temperature=19, humidity=55,
             status='available'),

    FarmNode(id=4,  name='Farm #05 — Balcony',
             lat=43.6480, lng=-79.3810, plot_size_sqft=15,
             plot_type='balcony',   tools='basic',        budget='low',
             pH=5.8, moisture=45, temperature=24, humidity=58,
             status='new'),

    FarmNode(id=5,  name='Farm #06 — Rooftop',
             lat=43.6680, lng=-79.4020, plot_size_sqft=90,
             plot_type='rooftop',   tools='intermediate', budget='medium',
             pH=6.6, moisture=68, temperature=21, humidity=63,
             status='available'),

    FarmNode(id=8,  name='Farm #09 — Balcony',
             lat=43.6510, lng=-79.3870, plot_size_sqft=20,
             plot_type='balcony',   tools='basic',        budget='low',
             pH=6.4, moisture=60, temperature=23, humidity=62,
             status='available'),

    FarmNode(id=10, name='Farm #11 — Backyard',
             lat=43.6450, lng=-79.3700, plot_size_sqft=200,
             plot_type='backyard',  tools='basic',        budget='medium',
             pH=6.1, moisture=55, temperature=18, humidity=52,
             status='available'),

    FarmNode(id=12, name='Farm #13 — Balcony',
             lat=43.6540, lng=-79.3800, plot_size_sqft=18,
             plot_type='balcony',   tools='basic',        budget='low',
             pH=6.3, moisture=55, temperature=22, humidity=60,
             status='available'),

    FarmNode(id=13, name='Farm #14 — Rooftop',
             lat=43.6590, lng=-79.3920, plot_size_sqft=110,
             plot_type='rooftop',   tools='advanced',     budget='high',
             pH=6.8, moisture=72, temperature=22, humidity=65,
             status='available'),

    FarmNode(id=15, name='Farm #16 — Community Lot',
             lat=43.6700, lng=-79.3960, plot_size_sqft=320,
             plot_type='community', tools='intermediate', budget='medium',
             pH=6.5, moisture=67, temperature=20, humidity=64,
             status='available'),

    FarmNode(id=16, name='Farm #17 — Balcony',
             lat=43.6500, lng=-79.3840, plot_size_sqft=12,
             plot_type='balcony',   tools='basic',        budget='low',
             pH=6.6, moisture=63, temperature=23, humidity=61,
             status='new'),

    FarmNode(id=17, name='Farm #18 — Rooftop',
             lat=43.6360, lng=-79.3560, plot_size_sqft=85,
             plot_type='rooftop',   tools='intermediate', budget='medium',
             pH=6.4, moisture=60, temperature=19, humidity=55,
             status='available'),

    FarmNode(id=18, name='Farm #19 — Backyard',
             lat=43.6470, lng=-79.3770, plot_size_sqft=250,
             plot_type='backyard',  tools='advanced',     budget='high',
             pH=6.9, moisture=73, temperature=21, humidity=67,
             status='available'),

    # ── LOCKED (status='growing') ─────────────────────────────────────────────
    FarmNode(id=1,  name='Farm #02 — Rooftop',
             lat=43.6550, lng=-79.3900, plot_size_sqft=80,
             plot_type='rooftop',   tools='intermediate', budget='medium',
             pH=6.8, moisture=70, temperature=21, humidity=60,
             status='growing', current_crop_id=0,
             cycle_end_date=date(2026, 3, 20)),     # Tomato

    FarmNode(id=3,  name='Farm #04 — Community Lot',
             lat=43.6610, lng=-79.3950, plot_size_sqft=400,
             plot_type='community', tools='advanced',     budget='high',
             pH=7.0, moisture=72, temperature=20, humidity=68,
             status='growing', current_crop_id=1,
             cycle_end_date=date(2026, 3, 10)),     # Lettuce

    FarmNode(id=6,  name='Farm #07 — Backyard',
             lat=43.6420, lng=-79.3650, plot_size_sqft=150,
             plot_type='backyard',  tools='basic',        budget='low',
             pH=6.3, moisture=62, temperature=19, humidity=57,
             status='growing', current_crop_id=5,
             cycle_end_date=date(2026, 3, 15)),     # Kale

    FarmNode(id=7,  name='Farm #08 — Community Lot',
             lat=43.6720, lng=-79.3980, plot_size_sqft=350,
             plot_type='community', tools='advanced',     budget='high',
             pH=6.9, moisture=75, temperature=22, humidity=70,
             status='growing', current_crop_id=0,
             cycle_end_date=date(2026, 3, 25)),     # Tomato

    FarmNode(id=9,  name='Farm #10 — Rooftop',
             lat=43.6380, lng=-79.3580, plot_size_sqft=70,
             plot_type='rooftop',   tools='intermediate', budget='medium',
             pH=6.7, moisture=65, temperature=20, humidity=58,
             status='growing', current_crop_id=7,
             cycle_end_date=date(2026, 3, 5)),      # Microgreens

    FarmNode(id=11, name='Farm #12 — Community Lot',
             lat=43.6660, lng=-79.4050, plot_size_sqft=280,
             plot_type='community', tools='intermediate', budget='medium',
             pH=7.1, moisture=78, temperature=21, humidity=72,
             status='growing', current_crop_id=2,
             cycle_end_date=date(2026, 3, 12)),     # Spinach

    FarmNode(id=14, name='Farm #15 — Backyard',
             lat=43.6430, lng=-79.3640, plot_size_sqft=180,
             plot_type='backyard',  tools='basic',        budget='low',
             pH=5.9, moisture=50, temperature=17, humidity=48,
             status='growing', current_crop_id=4,
             cycle_end_date=date(2026, 3, 30)),     # Carrots

    FarmNode(id=19, name='Farm #20 — Community Lot',
             lat=43.6640, lng=-79.4030, plot_size_sqft=180,
             plot_type='community', tools='basic',        budget='low',
             pH=6.2, moisture=58, temperature=20, humidity=58,
             status='growing', current_crop_id=9,
             cycle_end_date=date(2026, 3, 18)),     # Beans
]
