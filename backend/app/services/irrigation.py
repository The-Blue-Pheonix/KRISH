# ✅ Soil condition (state only)
def soil_condition_logic(user_input, rainfall):

    if user_input != "Auto":
        return user_input   # Dry / Wet

    if rainfall < 20:
        return "Dry"
    else:
        return "Wet"


# ✅ Irrigation decision (uses temp + soil)// সেচ (jol dewa)
def irrigation_decision(temp, rainfall, soil_condition):

    if soil_condition == "Dry" and temp > 30:
        return "Yes"

    if rainfall > 50:
        return "No"

    return "Monitor"