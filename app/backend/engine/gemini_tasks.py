"""
Gemini-powered task generation for farm nodes.
All Gemini interaction is isolated here — no other file calls the API directly.
"""
import os
import json

import google.generativeai as genai

from .schemas import FarmNode, Crop

_REQUIRED_KEYS = {'id', 'title', 'subtitle', 'why', 'how', 'target', 'tools_required', 'day_from_start'}


def build_task_prompt(
    farm: FarmNode,
    crop: Crop,
    sqft_allocated: float,
    quantity_kg: float,
    cycle_number: int,
    hub_name: str,
    hub_priority: str,
) -> str:
    total_days = crop.grow_weeks * 7

    # Only include soil variables that have been measured
    nutrient_parts = []
    if farm.nitrogen_ppm is not None:
        nutrient_parts.append(f"N={farm.nitrogen_ppm}ppm")
    if farm.phosphorus_ppm is not None:
        nutrient_parts.append(f"P={farm.phosphorus_ppm}ppm")
    if farm.potassium_ppm is not None:
        nutrient_parts.append(f"K={farm.potassium_ppm}ppm")
    nutrients = ", ".join(nutrient_parts) if nutrient_parts else "not measured"

    sunlight = f"{farm.sunlight_hours} hrs/day" if farm.sunlight_hours is not None else "unknown"
    drainage = farm.drainage or "unknown"
    aspect   = farm.aspect or "unknown"
    water    = farm.water_availability or "unknown"

    return f"""You are an expert urban farming assistant. Generate personalized farming tasks.

Farm profile:
- Plot type: {farm.plot_type} | Size: {sqft_allocated} sqft allocated | Tools: {farm.tools} | Budget: {farm.budget}
- Soil: pH {farm.pH}, moisture {farm.moisture}%, temp {farm.temperature}°C, humidity {farm.humidity}%
- Sunlight: {sunlight} | Drainage: {drainage} | Aspect: {aspect}
- Nutrients: {nutrients}
- Water availability: {water}

Assigned crop: {crop.name}
- Grow cycle: {crop.grow_weeks} weeks ({total_days} days total)
- Optimal pH: {crop.optimal_pH[0]}–{crop.optimal_pH[1]}
- Optimal moisture: {crop.optimal_moisture[0]}–{crop.optimal_moisture[1]}%
- Optimal temp: {crop.optimal_temp[0]}–{crop.optimal_temp[1]}°C
- Expected yield: {quantity_kg} kg | Cycle #{cycle_number}

Delivery hub: {hub_name} ({hub_priority} priority)

Generate 5–8 farming tasks covering this complete {total_days}-day grow cycle.
Return ONLY a JSON array with no extra text. Each object must have exactly these fields:
- id: integer (1-based, sequential)
- title: string (short action label, max 30 chars)
- subtitle: string (tools + time estimate, e.g. "Trowel · 20 min")
- why: string (1 sentence — why this task matters for THIS farm's specific conditions, reference actual readings)
- how: string (2–3 sentences — step-by-step instructions adapted to this farm's tools and plot type)
- target: string (measurable success indicator)
- tools_required: string (comma-separated)
- day_from_start: integer (day in cycle to do this task, spread across {total_days} days)

Tasks MUST reference the farm's actual readings (e.g. "Your pH {farm.pH} is..."). Do not give generic crop advice."""


def call_gemini(prompt: str) -> list[dict] | None:
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name='gemini-2.0-flash',
            generation_config={'response_mime_type': 'application/json'},
        )
        response = model.generate_content(prompt)
        tasks = json.loads(response.text)

        if not isinstance(tasks, list):
            return None

        for task in tasks:
            if not isinstance(task, dict):
                return None
            if not _REQUIRED_KEYS.issubset(task.keys()):
                return None

        return tasks

    except Exception:
        return None


def generate_tasks_for_farm(
    farm: FarmNode,
    crop: Crop,
    sqft_allocated: float,
    quantity_kg: float,
    hub_name: str,
    hub_priority: str,
) -> list[dict] | None:
    cycle_number = farm.cycle_number or 1
    prompt = build_task_prompt(
        farm, crop, sqft_allocated, quantity_kg, cycle_number, hub_name, hub_priority
    )
    tasks = call_gemini(prompt)
    if tasks is None:
        return None

    # Inject crop identity — Gemini doesn't need to produce these
    for task in tasks:
        task['crop_id']   = crop.id
        task['crop_name'] = crop.name

    return tasks
