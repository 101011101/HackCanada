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

# ---------------------------------------------------------------------------
# CROP GUIDES  — one paragraph per crop, keyed by crop id
# Gemini-ready: when AI is integrated, replace static text with a prompt call
# ---------------------------------------------------------------------------
CROP_GUIDES: dict[int, str] = {
    0: (
        "Tomatoes thrive in warm, sunny spots with well-draining soil. Plant in a location "
        "with at least 6 hours of direct sunlight. Support plants with cages or stakes as they grow. "
        "Water consistently at the base to avoid leaf diseases — aim for 1–2 inches per week. "
        "Prune suckers (shoots between stem and branch) to focus energy on fruit production. "
        "Feed with a balanced fertilizer every 2 weeks once flowering begins."
    ),
    1: (
        "Lettuce is one of the easiest crops for small spaces and containers. It prefers cool "
        "temperatures and partial shade in hot weather. Sow seeds directly and keep soil consistently "
        "moist. Harvest outer leaves regularly to extend the growing season — avoid pulling the whole "
        "plant. Lettuce bolts (goes to seed) in heat, so time your planting for spring or fall."
    ),
    2: (
        "Spinach grows best in cool weather and is frost-tolerant, making it ideal for early spring "
        "or fall planting. Direct sow seeds and thin seedlings to prevent crowding. Keep soil evenly "
        "moist and feed lightly with nitrogen. Harvest outer leaves first and the plant will continue "
        "producing. Like lettuce, spinach bolts in heat — shade cloth can extend the season."
    ),
    3: (
        "Most culinary herbs prefer well-draining soil and 6+ hours of sunlight. Water when the top "
        "inch of soil is dry — overwatering is the most common mistake. Pinch growing tips regularly "
        "to prevent flowering and encourage bushy growth. Many herbs grow well in containers. "
        "Harvest in the morning when essential oils are strongest for best flavour."
    ),
    4: (
        "Carrots need deep, loose, rock-free soil to develop straight roots. Sow seeds thinly and "
        "thin seedlings early — crowding causes forked roots. Keep soil consistently moist during "
        "germination (can take 2–3 weeks). Once established, water deeply but less frequently to "
        "encourage deep root growth. Carrots are ready when shoulders show colour at the soil surface."
    ),
    5: (
        "Kale is one of the most cold-hardy vegetables and actually sweetens after frost. Plant in "
        "full sun with well-draining soil. Water regularly and feed with nitrogen every 3–4 weeks. "
        "Harvest outer leaves from the bottom up, leaving the growing centre intact. Remove yellowing "
        "leaves promptly. Kale can produce continuously for months if harvested correctly."
    ),
    6: (
        "Peppers need warm soil and air temperatures to thrive — don't rush planting outdoors. They "
        "prefer full sun and consistent moisture. Stake plants early before they get top-heavy with "
        "fruit. A phosphorus-rich fertilizer at flowering time boosts fruit set. Pinching the very "
        "first flowers can redirect energy and increase total yield. Both sweet and hot peppers are "
        "harvested when fully coloured and firm."
    ),
    7: (
        "Microgreens are the fastest and most space-efficient crop — harvest in as little as 7–14 "
        "days. Use a shallow tray with 1–2 inches of growing medium. Sow seeds densely, press gently, "
        "and cover for the first few days to retain moisture and promote germination. Once sprouted, "
        "move to bright light. Water from below to prevent damping-off. Harvest with scissors at soil "
        "level when cotyledons are fully open."
    ),
    8: (
        "Strawberries prefer slightly acidic soil and good drainage. Plant crowns at exactly soil "
        "level — too deep causes rot, too shallow causes drying. In the first season, remove early "
        "flowers to let the plant establish a strong root system. Potassium-rich fertilizer supports "
        "fruiting. Pin runners to extend the patch or remove them to concentrate energy on the mother "
        "plant. Harvest when berries are fully red with no white shoulders."
    ),
    9: (
        "Beans are nitrogen-fixers and improve soil health while they grow. Direct sow after last "
        "frost into warm soil — beans rot in cold, wet conditions. For climbing varieties, set up "
        "your trellis before sowing to avoid disturbing roots. Water at the base to prevent fungal "
        "issues. Beans are ready when pods snap cleanly and seeds inside are just visible — don't "
        "let them over-mature or the plant will stop producing."
    ),
}

# ---------------------------------------------------------------------------
# CROP TASKS  — ordered task list per crop, keyed by crop id
# day_from_start: days after cycle_start_date the task is due
# ---------------------------------------------------------------------------
CROP_TASKS: dict[int, list[dict]] = {
    0: [  # Tomato (70 days)
        {'id': 1,  'title': 'Prepare soil',        'subtitle': 'Spade + compost · 1 hr',   'why': 'Tomatoes need loose, nutrient-rich soil to develop strong roots.',     'how': 'Dig 30 cm deep, mix in 5 cm of compost. Check pH (target 6.0–7.0).',     'target': 'Loose, dark, crumbly soil',              'tools_required': 'spade, compost',          'day_from_start': 0},
        {'id': 2,  'title': 'Plant seedlings',     'subtitle': 'Trowel · 30 min',           'why': 'Transplanting at the right depth encourages strong stem growth.',        'how': 'Plant deep — bury up to the first true leaves. Space 45 cm apart.',       'target': 'Seedlings upright and firm',             'tools_required': 'trowel',                  'day_from_start': 3},
        {'id': 3,  'title': 'Install stakes',      'subtitle': 'Stakes + ties · 20 min',    'why': 'Early staking prevents stem damage as the plant grows heavy.',           'how': 'Drive a 1.5 m stake 10 cm from the stem. Loosely tie the main stem.',     'target': 'Plant supported without constriction',   'tools_required': 'stakes, garden ties',     'day_from_start': 14},
        {'id': 4,  'title': 'First fertilize',     'subtitle': 'Liquid feed · 15 min',      'why': 'A nitrogen-rich feed boosts early vegetative growth.',                   'how': 'Apply balanced liquid fertilizer at half-strength to moist soil.',         'target': 'Dark green healthy leaves',              'tools_required': 'watering can',            'day_from_start': 21},
        {'id': 5,  'title': 'Prune suckers',       'subtitle': 'Fingers or snips · 20 min', 'why': 'Removing suckers directs energy into fruit rather than extra stems.',    'how': 'Snap off shoots growing in the V between stem and branch while small.',    'target': 'Single or double leader stem',           'tools_required': 'pruning snips',           'day_from_start': 35},
        {'id': 6,  'title': 'Pest check',          'subtitle': 'Visual inspection · 10 min','why': 'Early pest detection prevents colony establishment.',                     'how': 'Check under leaves for aphids, whitefly, or hornworm eggs. Remove by hand.','target': 'No visible pest colonies',              'tools_required': 'none',                    'day_from_start': 49},
        {'id': 7,  'title': 'Harvest',             'subtitle': 'Harvest · ongoing',          'why': 'Regular picking encourages continued fruit production.',                  'how': 'Twist fruit gently or cut with snips when fully coloured and slightly soft.','target': 'Ripe fruit removed every 2–3 days',     'tools_required': 'basket, snips',           'day_from_start': 63},
    ],
    1: [  # Lettuce (28 days)
        {'id': 1,  'title': 'Prepare bed',         'subtitle': 'Rake · 20 min',             'why': 'Lettuce seeds need fine, loose soil for even germination.',              'how': 'Rake surface smooth, remove debris, water lightly.',                       'target': 'Fine, moist seedbed',                    'tools_required': 'rake',                    'day_from_start': 0},
        {'id': 2,  'title': 'Sow seeds',           'subtitle': 'Seed tray · 15 min',        'why': 'Thin, even sowing prevents overcrowding and bolting.',                   'how': 'Scatter seeds thinly, press lightly, cover with 3 mm of fine soil.',       'target': 'Even coverage, no clumping',             'tools_required': 'seed tray or fingers',    'day_from_start': 1},
        {'id': 3,  'title': 'Thin seedlings',      'subtitle': 'Fingers · 10 min',          'why': 'Crowded seedlings compete for nutrients and bolt early.',                 'how': 'Remove weaker seedlings to leave 15 cm spacing. Eat the thinnings.',       'target': '15 cm between plants',                  'tools_required': 'none',                    'day_from_start': 10},
        {'id': 4,  'title': 'Water deeply',        'subtitle': 'Watering can · 10 min',     'why': 'Consistent moisture prevents bitterness and premature bolting.',          'how': 'Water at the base, keep soil evenly moist but not waterlogged.',            'target': 'Moist soil 5 cm deep',                  'tools_required': 'watering can',            'day_from_start': 14},
        {'id': 5,  'title': 'Check for bolting',   'subtitle': 'Visual check · 5 min',      'why': 'Bolting makes leaves bitter — early detection allows quick harvest.',     'how': 'Look for a tall central stem forming. Harvest immediately if spotted.',    'target': 'No central seed stalk visible',          'tools_required': 'none',                    'day_from_start': 21},
        {'id': 6,  'title': 'Harvest outer leaves','subtitle': 'Scissors · 15 min',         'why': 'Cut-and-come-again harvesting extends productivity.',                     'how': 'Cut outer leaves at the base leaving the inner rosette intact.',            'target': '1/3 of leaves removed per harvest',     'tools_required': 'scissors, basket',        'day_from_start': 25},
    ],
    2: [  # Spinach (28 days)
        {'id': 1,  'title': 'Prepare cool bed',    'subtitle': 'Rake · 20 min',             'why': 'Spinach germinates best in cool, moist conditions.',                     'how': 'Rake smooth, water to settle the soil. Avoid hot afternoon-sun spots.',    'target': 'Cool, moist, fine seedbed',              'tools_required': 'rake',                    'day_from_start': 0},
        {'id': 2,  'title': 'Sow seeds',           'subtitle': 'Fingers · 15 min',          'why': 'Proper depth and spacing sets up even germination.',                      'how': 'Sow 2 cm deep, 5 cm apart in rows 30 cm apart. Cover and firm gently.',   'target': 'Even rows, good soil contact',           'tools_required': 'dibber or finger',        'day_from_start': 1},
        {'id': 3,  'title': 'Thin to 8 cm',        'subtitle': 'Fingers · 10 min',          'why': 'Thinning prevents competition and improves air circulation.',              'how': 'Remove weaker seedlings, leaving 8 cm between plants.',                    'target': '8 cm spacing throughout bed',            'tools_required': 'none',                    'day_from_start': 10},
        {'id': 4,  'title': 'Side-dress nitrogen', 'subtitle': 'Granular feed · 10 min',    'why': 'Nitrogen drives the leafy growth spinach is grown for.',                  'how': 'Sprinkle a small amount of nitrogen fertilizer around plants, water in.',  'target': 'Deep green, large leaves',               'tools_required': 'fertilizer, gloves',      'day_from_start': 14},
        {'id': 5,  'title': 'Harvest outer leaves','subtitle': 'Scissors · 15 min',         'why': 'Outer-leaf harvest keeps the plant producing longer.',                    'how': 'Cut largest outer leaves at the base. Leave centre rosette intact.',        'target': '1/3 of leaves per session',              'tools_required': 'scissors, basket',        'day_from_start': 24},
    ],
    3: [  # Herbs (42 days)
        {'id': 1,  'title': 'Prepare containers',  'subtitle': 'Trowel · 20 min',           'why': 'Herbs need well-draining soil — waterlogging kills most varieties.',       'how': 'Fill pots with free-draining mix. Ensure drainage holes are clear.',       'target': 'Containers draining freely',             'tools_required': 'trowel, pots',            'day_from_start': 0},
        {'id': 2,  'title': 'Sow or transplant',   'subtitle': 'Trowel · 20 min',           'why': 'Correct planting depth ensures strong root establishment.',                'how': 'Plant at same depth as nursery pot. Space 15–20 cm apart for airflow.',    'target': 'Plants upright, soil firmed',            'tools_required': 'trowel',                  'day_from_start': 2},
        {'id': 3,  'title': 'Pinch growing tips',  'subtitle': 'Fingers · 10 min',          'why': 'Pinching promotes bushy growth instead of tall, spindly stems.',           'how': 'Remove top 2–3 cm of each stem above a leaf node.',                        'target': 'Compact, multi-branched plants',         'tools_required': 'none',                    'day_from_start': 14},
        {'id': 4,  'title': 'First harvest',       'subtitle': 'Scissors · 15 min',         'why': 'Early harvesting encourages continuous production.',                       'how': 'Cut no more than 1/3 of the plant. Harvest in the morning.',               'target': '1/3 of stems harvested',                'tools_required': 'scissors',                'day_from_start': 28},
        {'id': 5,  'title': 'Light fertilize',     'subtitle': 'Liquid feed · 10 min',      'why': 'Light feeding maintains growth without reducing flavour intensity.',        'how': 'Apply diluted liquid fertilizer (half-strength) to moist soil.',           'target': 'Healthy green foliage',                  'tools_required': 'watering can',            'day_from_start': 35},
        {'id': 6,  'title': 'Major harvest',       'subtitle': 'Scissors · 20 min',         'why': 'Full harvest before flowering preserves peak flavour.',                    'how': 'Cut stems back by up to 2/3. Dry or use immediately.',                     'target': 'Substantial yield collected',            'tools_required': 'scissors, basket',        'day_from_start': 40},
    ],
    4: [  # Carrots (70 days)
        {'id': 1,  'title': 'Deep loosen soil',    'subtitle': 'Fork · 45 min',             'why': 'Compacted soil causes forked, stunted roots.',                            'how': 'Fork 40 cm deep, remove all rocks and clumps. Do not add fresh manure.',  'target': 'Fine, stone-free soil 40 cm deep',      'tools_required': 'garden fork',             'day_from_start': 0},
        {'id': 2,  'title': 'Sow seeds thinly',    'subtitle': 'Fingers · 20 min',          'why': 'Even spacing produces straight, full-sized carrots.',                     'how': 'Sow 1 cm deep in rows 20 cm apart. Mix seed with sand to help spacing.',  'target': 'Thin, even rows',                       'tools_required': 'none',                    'day_from_start': 2},
        {'id': 3,  'title': 'Thin to 5 cm',        'subtitle': 'Scissors · 15 min',         'why': 'Thinning is the most important step for carrot size.',                    'how': 'Snip (do not pull) surplus seedlings at soil level to avoid disturbing neighbours.','target': '5 cm spacing throughout',         'tools_required': 'scissors',                'day_from_start': 21},
        {'id': 4,  'title': 'Water deeply',        'subtitle': 'Watering can · 10 min',     'why': 'Deep, infrequent watering encourages roots to grow downward.',            'how': 'Water thoroughly once or twice per week. Avoid shallow daily watering.',   'target': 'Moist soil 15 cm deep',                 'tools_required': 'watering can',            'day_from_start': 28},
        {'id': 5,  'title': 'Check shoulder colour','subtitle': 'Visual check · 5 min',     'why': 'Colour at the soil surface is the most reliable ripeness indicator.',     'how': 'Brush away soil at the base. Harvest when shoulders show full colour.',    'target': 'Shoulders fully coloured',               'tools_required': 'none',                    'day_from_start': 56},
        {'id': 6,  'title': 'Harvest',             'subtitle': 'Fork + hands · 30 min',     'why': 'Timely harvest prevents woodiness and cracking.',                         'how': 'Loosen soil with a fork beside the row, then pull gently by the foliage.', 'target': 'Clean, full-sized roots',               'tools_required': 'fork, basket',            'day_from_start': 63},
    ],
    5: [  # Kale (42 days)
        {'id': 1,  'title': 'Prepare bed',         'subtitle': 'Fork + compost · 30 min',   'why': 'Kale is a heavy feeder and needs fertile, moisture-retaining soil.',      'how': 'Fork in 5 cm of compost. Firm the surface and water.',                     'target': 'Rich, firm seedbed',                    'tools_required': 'fork, compost',           'day_from_start': 0},
        {'id': 2,  'title': 'Sow or transplant',   'subtitle': 'Trowel · 20 min',           'why': 'Getting plants established early maximises the growing window.',           'how': 'Sow 1 cm deep or transplant 45 cm apart. Water in well.',                  'target': 'Plants firm and well-watered',           'tools_required': 'trowel',                  'day_from_start': 2},
        {'id': 3,  'title': 'Thin / space plants', 'subtitle': 'Fingers · 10 min',          'why': 'Adequate spacing prevents disease and encourages large leaves.',           'how': 'Ensure 45 cm between plants. Remove any weaker seedlings.',                'target': '45 cm spacing',                         'tools_required': 'none',                    'day_from_start': 14},
        {'id': 4,  'title': 'Side-dress nitrogen', 'subtitle': 'Granular feed · 10 min',    'why': 'Nitrogen supports the large, productive leaf canopy kale is known for.',  'how': 'Scatter nitrogen fertilizer around the drip line and water in.',            'target': 'Deep green, broad leaves',               'tools_required': 'fertilizer, gloves',      'day_from_start': 21},
        {'id': 5,  'title': 'Harvest outer leaves','subtitle': 'Scissors · 15 min',         'why': 'Outer-leaf harvesting keeps the plant producing for months.',              'how': 'Remove the lowest 2–3 leaves, leaving the top growing crown intact.',       'target': '3+ leaves harvested per plant',          'tools_required': 'scissors, basket',        'day_from_start': 35},
        {'id': 6,  'title': 'Continue harvesting', 'subtitle': 'Scissors · ongoing',        'why': 'Regular harvesting prevents toughening and stimulates new growth.',        'how': 'Harvest every 1–2 weeks, always leaving the top 6+ leaves intact.',         'target': 'Continuous weekly yield',               'tools_required': 'scissors, basket',        'day_from_start': 40},
    ],
    6: [  # Peppers (84 days)
        {'id': 1,  'title': 'Warm soil',           'subtitle': 'Thermometer · 5 min',       'why': 'Peppers stall or rot in cold soil below 18°C.',                           'how': 'Measure soil temperature. Cover with black plastic for a week if needed.', 'target': 'Soil temp ≥ 18°C',                      'tools_required': 'soil thermometer',        'day_from_start': 0},
        {'id': 2,  'title': 'Transplant seedlings','subtitle': 'Trowel · 30 min',           'why': 'Peppers must be started indoors — transplant after last frost.',           'how': 'Plant at same depth as nursery pot. Space 45 cm apart in full sun.',        'target': 'Upright plants, no wilting',             'tools_required': 'trowel',                  'day_from_start': 3},
        {'id': 3,  'title': 'Install stakes',      'subtitle': 'Stakes + ties · 20 min',    'why': 'Pepper stems snap easily under fruit weight.',                             'how': 'Stake each plant with a 60 cm support. Tie loosely.',                      'target': 'Every plant supported',                 'tools_required': 'stakes, ties',            'day_from_start': 21},
        {'id': 4,  'title': 'Phosphorus fertilize','subtitle': 'Liquid feed · 15 min',      'why': 'Phosphorus drives root strength and flower/fruit development.',             'how': 'Apply phosphorus-rich liquid feed at first sign of flower buds.',           'target': 'Multiple flower buds visible',           'tools_required': 'watering can',            'day_from_start': 35},
        {'id': 5,  'title': 'Pinch first flowers', 'subtitle': 'Fingers · 10 min',          'why': 'Removing first flowers redirects energy to build a stronger plant.',       'how': 'Pinch off the first 3–5 flowers. Allow all subsequent ones to set fruit.', 'target': 'First flush flowers removed',            'tools_required': 'none',                    'day_from_start': 49},
        {'id': 6,  'title': 'Check fruit set',     'subtitle': 'Visual check · 10 min',     'why': 'Confirming fruit set helps identify pollination problems early.',           'how': 'Count small fruits forming behind wilted flowers. Shake plants gently to aid pollination.','target': 'Fruit visible on majority of plants','tools_required': 'none',             'day_from_start': 63},
        {'id': 7,  'title': 'Harvest',             'subtitle': 'Snips · ongoing',            'why': 'Timely harvest encourages continued fruit production.',                    'how': 'Cut with snips when fully coloured and firm. Leave 1 cm of stem.',          'target': 'Ripe peppers removed every 3–4 days',   'tools_required': 'snips, basket',           'day_from_start': 77},
    ],
    7: [  # Microgreens (14 days)
        {'id': 1,  'title': 'Fill growing tray',   'subtitle': 'Trowel · 10 min',           'why': 'A shallow, consistent medium depth ensures even germination.',             'how': 'Fill tray with 2 cm of moistened growing medium. Level and firm gently.',  'target': 'Even 2 cm layer, moist throughout',     'tools_required': 'tray, growing medium',    'day_from_start': 0},
        {'id': 2,  'title': 'Sow seeds densely',   'subtitle': 'Fingers · 10 min',          'why': 'Dense sowing is correct for microgreens — plants support each other.',     'how': 'Scatter seeds to cover the surface completely. Press gently to ensure contact.','target': 'Full surface coverage, seeds touching', 'tools_required': 'seeds',                 'day_from_start': 1},
        {'id': 3,  'title': 'Cover and weight',    'subtitle': 'Cover tray · 5 min',        'why': 'Darkness and pressure on seeds speeds germination.',                       'how': 'Place an empty tray on top as a weight. Mist lightly to maintain moisture.','target': 'Seeds in contact with medium, covered', 'tools_required': 'cover tray',            'day_from_start': 2},
        {'id': 4,  'title': 'Move to light',       'subtitle': 'Relocate · 5 min',          'why': 'Light triggers chlorophyll and the green colour microgreens are valued for.','how': 'Remove cover when seeds have sprouted 1–2 cm. Place under grow light or bright window.','target': 'Green colour developing in sprouts', 'tools_required': 'grow light or windowsill','day_from_start': 5},
        {'id': 5,  'title': 'Bottom-water',        'subtitle': 'Watering can · 5 min',      'why': 'Watering from below prevents damping-off fungus on the delicate stems.',   'how': 'Pour water into a tray beneath the growing tray. Let it absorb for 10 min.','target': 'Medium moist, stems dry',               'tools_required': 'watering tray',           'day_from_start': 10},
        {'id': 6,  'title': 'Harvest',             'subtitle': 'Scissors · 10 min',          'why': 'Harvesting at cotyledon stage gives peak nutrition and flavour.',          'how': 'Cut just above soil level with clean scissors when 3–5 cm tall. Rinse and use immediately.','target': 'Full tray harvested in one cut', 'tools_required': 'scissors, bowl',        'day_from_start': 14},
    ],
    8: [  # Strawberries (56 days)
        {'id': 1,  'title': 'Prepare raised bed',  'subtitle': 'Fork + compost · 45 min',   'why': 'Strawberries need excellent drainage — waterlogging causes crown rot.',     'how': 'Build up bed 15 cm with compost-rich, slightly acidic soil (pH 5.5–6.5).',  'target': 'Well-draining, raised bed',              'tools_required': 'fork, compost',           'day_from_start': 0},
        {'id': 2,  'title': 'Plant crowns',        'subtitle': 'Trowel · 30 min',           'why': 'Crown depth is critical — too deep rots, too shallow dries out.',          'how': 'Set crown exactly at soil surface. Space 30 cm apart. Water in well.',      'target': 'Crown at soil level, roots covered',    'tools_required': 'trowel',                  'day_from_start': 2},
        {'id': 3,  'title': 'Remove first flowers','subtitle': 'Fingers · 10 min',          'why': 'Sacrificing first-year flowers builds a stronger root system for higher future yield.','how': 'Pinch off all flowers for the first 3–4 weeks after planting.', 'target': 'No fruit forming in first month',       'tools_required': 'none',                    'day_from_start': 14},
        {'id': 4,  'title': 'Potassium fertilize', 'subtitle': 'Liquid feed · 15 min',      'why': 'Potassium directly improves fruit size, flavour, and disease resistance.',  'how': 'Apply potassium-rich liquid feed (tomato feed works well) every 2 weeks.',  'target': 'Strong flower production',               'tools_required': 'watering can',            'day_from_start': 28},
        {'id': 5,  'title': 'Manage runners',      'subtitle': 'Snips · 15 min',            'why': 'Runners divert energy — pin them to propagate or remove to focus on fruit.','how': 'Decide: pin runners to soil to root new plants, or cut them off at the base.','target': 'Runners managed, not left trailing',   'tools_required': 'snips or pegs',           'day_from_start': 42},
        {'id': 6,  'title': 'Harvest',             'subtitle': 'Fingers · ongoing',          'why': 'Ripe strawberries must be picked promptly to prevent mould.',              'how': 'Pick when fully red with no white at the tip. Twist gently to detach.',     'target': 'All ripe fruit removed every 1–2 days', 'tools_required': 'basket',                  'day_from_start': 50},
    ],
    9: [  # Beans (56 days)
        {'id': 1,  'title': 'Prepare warm soil',   'subtitle': 'Fork · 20 min',             'why': 'Beans rot in cold soil — soil must be above 16°C.',                       'how': 'Check soil temperature. Fork lightly to aerate, do not over-disturb.',     'target': 'Soil temp ≥ 16°C, loose surface',       'tools_required': 'fork, thermometer',       'day_from_start': 0},
        {'id': 2,  'title': 'Sow seeds',           'subtitle': 'Dibber · 20 min',           'why': 'Direct sowing avoids transplant shock — beans dislike root disturbance.',  'how': 'Sow 4 cm deep, 10 cm apart in rows 45 cm apart. Do not pre-soak.',         'target': 'Seeds evenly spaced and covered',       'tools_required': 'dibber',                  'day_from_start': 2},
        {'id': 3,  'title': 'Set up trellis',      'subtitle': 'Trellis + ties · 30 min',   'why': 'Climbing beans need vertical support before they need it — late setup damages roots.','how': 'Install a 1.8 m trellis or netting above the rows. Guide first shoots.','target': 'Trellis in place before 20 cm height',  'tools_required': 'trellis, ties',           'day_from_start': 14},
        {'id': 4,  'title': 'Water at base',       'subtitle': 'Watering can · 10 min',     'why': 'Wet foliage promotes bean rust and other fungal diseases.',                'how': 'Always water at soil level. Keep leaves dry. Aim for 2.5 cm per week.',    'target': 'Moist soil, dry leaves',                'tools_required': 'watering can',            'day_from_start': 28},
        {'id': 5,  'title': 'Watch for flowers',   'subtitle': 'Visual check · 5 min',      'why': 'Flower-to-pod time is about 2 weeks — knowing this helps time harvest.',   'how': 'Note date when first flowers open. Pods should be ready 14 days later.',   'target': 'Flowers visible across the row',        'tools_required': 'none',                    'day_from_start': 35},
        {'id': 6,  'title': 'Harvest pods',        'subtitle': 'Fingers · ongoing',          'why': 'Over-mature pods signal the plant to stop producing — pick frequently.',   'how': 'Harvest when pods are firm and snap cleanly. Pick every 2–3 days.',        'target': 'No over-mature pods left on plant',     'tools_required': 'basket',                  'day_from_start': 49},
    ],
}
