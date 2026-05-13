const fs = require('fs');

const guideEn = JSON.parse(fs.readFileSync('src/data/guide_en.json', 'utf8'));

const dictionaries = {
  hi: { "Soil Types": "मिट्टी के प्रकार", "Crop Selection": "फसल चयन", "Alluvial": "जलोढ़", "Soil": "मिट्टी", "Crop": "फसल", "Water": "पानी", "Weather": "मौसम" },
  bn: { "Soil Types": "মাটির ধরন", "Crop Selection": "ফসল নির্বাচন", "Alluvial": "পলি", "Soil": "মাটি", "Crop": "ফসল", "Water": "জল", "Weather": "আবহাওয়া" },
  mr: { "Soil Types": "मातीचे प्रकार", "Crop Selection": "पीक निवड", "Alluvial": "गाळाची", "Soil": "माती", "Crop": "पीक", "Water": "पाणी", "Weather": "हवामान" },
  ta: { "Soil Types": "மண் வகைகள்", "Crop Selection": "பயிர் தேர்வு", "Alluvial": "வண்டல்", "Soil": "மண்", "Crop": "பயிர்", "Water": "தண்ணீர்", "Weather": "வானிலை" }
};

function translateObj(obj, dict) {
  if (typeof obj === 'string') {
    let str = obj;
    for (const [en, local] of Object.entries(dict)) {
      str = str.replace(new RegExp(en, 'gi'), local);
    }
    return str;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => translateObj(item, dict));
  }
  if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      if (['id', 'emoji', 'color', 'bg', 'type'].includes(key)) {
        newObj[key] = obj[key]; // Do not translate keys or structural props
      } else {
        newObj[key] = translateObj(obj[key], dict);
      }
    }
    return newObj;
  }
  return obj;
}

for (const [lang, dict] of Object.entries(dictionaries)) {
  const translated = translateObj(guideEn, dict);
  fs.writeFileSync(`src/data/guide_${lang}.json`, JSON.stringify(translated, null, 2));
  console.log(`Generated guide_${lang}.json`);
}
