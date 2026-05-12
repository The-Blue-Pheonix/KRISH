from dataclasses import dataclass

YIELD_TABLE = {
    "Rice": {"Alluvial": 20, "Black": 15, "Red": 12, "Laterite": 10},
    "Wheat": {"Alluvial": 18, "Black": 14, "Red": 10, "Laterite": 8},
    "Cotton": {"Alluvial": 10, "Black": 16, "Red": 8, "Laterite": 7},
    "Corn": {"Alluvial": 22, "Black": 18, "Red": 14, "Laterite": 12},
}

MSP_PRICES = {
    "Rice": 2183,
    "Wheat": 2275,
    "Cotton": 6620,
    "Corn": 1962,
}

DEFAULT_COSTS = {
    "seed": {"Rice": 1200, "Wheat": 1000, "Cotton": 2500, "Corn": 900},
    "fertilizer": {"Rice": 3500, "Wheat": 3000, "Cotton": 4000, "Corn": 2800},
    "pesticide": {"Rice": 1500, "Wheat": 800, "Cotton": 3000, "Corn": 700},
    "labor": {"Rice": 4000, "Wheat": 3500, "Cotton": 5000, "Corn": 3000},
    "irrigation": {"Rice": 2000, "Wheat": 1500, "Cotton": 2500, "Corn": 1200},
}


@dataclass
class ProfitEstimate:
    crop: str
    area_acres: float
    expected_yield_quintals: float
    gross_revenue: float
    total_cost: float
    net_profit: float
    roi_percent: float
    breakeven_yield: float
    price_per_quintal: float
    cost_breakdown: dict


def estimate_profit(
    crop: str,
    soil: str,
    area_acres: float = 1.0,
    market_price: float = None,
    irrigation_needed: bool = True,
) -> ProfitEstimate:
    base_yield = YIELD_TABLE.get(crop, {}).get(soil, 12)
    total_yield = base_yield * area_acres

    price = market_price or MSP_PRICES.get(crop, 2000)
    gross = total_yield * price

    seed_cost = DEFAULT_COSTS["seed"].get(crop, 0) * area_acres
    fertilizer_cost = DEFAULT_COSTS["fertilizer"].get(crop, 0) * area_acres
    pesticide_cost = DEFAULT_COSTS["pesticide"].get(crop, 0) * area_acres
    labor_cost = DEFAULT_COSTS["labor"].get(crop, 0) * area_acres
    irrigation_cost = (DEFAULT_COSTS["irrigation"].get(crop, 0) if irrigation_needed else 0) * area_acres

    cost_breakdown = {
        "seed": round(seed_cost, 2),
        "fertilizer": round(fertilizer_cost, 2),
        "pesticide": round(pesticide_cost, 2),
        "labor": round(labor_cost, 2),
        "irrigation": round(irrigation_cost, 2),
    }

    total_cost = sum(cost_breakdown.values())
    net = gross - total_cost
    roi = (net / total_cost * 100) if total_cost > 0 else 0
    breakeven = total_cost / price

    return ProfitEstimate(
        crop=crop,
        area_acres=area_acres,
        expected_yield_quintals=round(total_yield, 2),
        gross_revenue=round(gross, 2),
        total_cost=round(total_cost, 2),
        net_profit=round(net, 2),
        roi_percent=round(roi, 1),
        breakeven_yield=round(breakeven, 2),
        price_per_quintal=price,
        cost_breakdown=cost_breakdown,
    )
