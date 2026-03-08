from fastapi import APIRouter

from app.backend.api import storage, models
from app.backend.engine.schemas import FarmNode
from app.backend.engine.scorer  import compute_suitability

router = APIRouter()


@router.post('/suggestions', response_model=list[models.SuggestionItem])
def get_suggestions(req: models.SuggestionRequest):
    crops = [storage.dict_to_crop(d) for d in storage.load_crops()]

    # Construct a temporary FarmNode using request values; fill sensor defaults if not provided
    temp_farm = FarmNode(
        id=0, name='', lat=0.0, lng=0.0,
        plot_size_sqft=req.plot_size_sqft,
        plot_type=req.plot_type,
        tools=req.tools,
        budget=req.budget,
        pH=req.pH if req.pH is not None else 6.5,
        moisture=req.moisture if req.moisture is not None else 60.0,
        temperature=req.temperature if req.temperature is not None else 20.0,
        humidity=60.0,
        status='new',
        preferred_crop_ids=req.preferred_crop_ids,
    )

    items = []
    for crop in crops:
        suitability = compute_suitability(temp_farm, crop)
        if suitability <= 0:
            continue
        estimated_yield = round(suitability * crop.base_yield_per_sqft * req.plot_size_sqft, 1)
        items.append(models.SuggestionItem(
            crop_id            = crop.id,
            crop_name          = crop.name,
            suitability_pct    = round(suitability * 100, 1),
            estimated_yield_kg = estimated_yield,
            grow_weeks         = crop.grow_weeks,
            reason=(
                f"{suitability:.0%} suitability — "
                f"pH {temp_farm.pH:.1f} vs optimal {crop.optimal_pH[0]}–{crop.optimal_pH[1]}, "
                f"grows in {crop.grow_weeks} weeks"
            ),
        ))

    items.sort(key=lambda x: x.suitability_pct, reverse=True)
    return items
