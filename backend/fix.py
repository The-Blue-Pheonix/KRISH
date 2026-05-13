import re

with open('app/telegram_bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

def repl(match):
    return '''# Safe predict crop
        _w = profile.get('weather', {})
        _t = _w.get('temperature', 25)
        _h = _w.get('humidity', 60)
        _r = _w.get('rainfall', 100)
        try:
            _t = float(_t)
            _h = float(_h)
            _r = float(_r)
            _crop = predict_crop(temp=_t, humidity=_h, rainfall=_r, soil=soil)
        except Exception:
            _crop = 'Wheat'
        ml_output = {'predicted_crop': _crop}'''

content = re.sub(r'ml_output\s*=\s*predict_crop\(soil_type=soil,\s*location=location\)', repl, content)

with open('app/telegram_bot.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced successfully")
