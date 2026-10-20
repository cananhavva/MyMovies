// Mirror of the app's taxonomy (src/domain/taxonomy.ts, colors.ts, subcategories.ts).
// src/ai/proxyContract.test.ts fails if the two drift apart.

export const CATEGORIES = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'knitwear',
  'shoes',
  'bag',
  'accessory',
  'activewear',
  'swimwear',
  'underwear_sleep',
] as const;

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export const WEATHERS = ['hot', 'warm', 'mild', 'cool', 'cold', 'rainy', 'windy', 'snowy'] as const;

export const OCCASIONS = [
  'casual',
  'office',
  'business_formal',
  'night_out',
  'date',
  'party',
  'wedding_guest',
  'sport',
  'hiking_walking',
  'travel',
  'beach',
  'home_lounge',
] as const;

export const PATTERNS = ['solid', 'striped', 'checked', 'floral', 'print', 'other'] as const;

export const FIBER_TYPES = [
  'cashmere',
  'silk',
  'wool',
  'merino',
  'alpaca',
  'mohair',
  'linen',
  'cotton',
  'organic_cotton',
  'leather',
  'suede',
  'down',
  'lyocell',
  'modal',
  'viscose',
  'cupro',
  'nylon',
  'polyamide',
  'polyester',
  'recycled_polyester',
  'acrylic',
  'elastane',
  'pu_faux_leather',
  'other',
] as const;

export const COLORS = [
  'black',
  'charcoal',
  'grey',
  'white',
  'ivory',
  'beige',
  'camel',
  'sand',
  'brown',
  'navy',
  'blue',
  'light_blue',
  'green',
  'olive',
  'red',
  'burgundy',
  'pink',
  'purple',
  'yellow',
  'orange',
  'gold',
  'silver',
  'multicolor',
] as const;

export const SUBCATEGORIES: Readonly<Record<(typeof CATEGORIES)[number], readonly string[]>> = {
  top: ['t_shirt', 'shirt', 'blouse', 'tank_top', 'polo', 'sweatshirt', 'hoodie'],
  bottom: ['jeans', 'trousers', 'chinos', 'shorts', 'skirt', 'leggings'],
  dress: ['day_dress', 'evening_dress', 'maxi_dress', 'jumpsuit'],
  outerwear: ['blazer', 'trench_coat', 'raincoat', 'coat', 'puffer', 'parka', 'denim_jacket', 'leather_jacket', 'windbreaker'],
  knitwear: ['fine_knit', 'sweater', 'cardigan', 'vest'],
  shoes: ['sneakers', 'loafers', 'boots', 'ankle_boots', 'hiking_boots', 'heels', 'flats', 'sandals'],
  bag: ['tote', 'shoulder_bag', 'crossbody', 'backpack', 'clutch'],
  accessory: ['belt', 'scarf', 'hat', 'jewelry', 'sunglasses', 'watch'],
  activewear: ['sports_top', 'sports_leggings', 'track_jacket'],
  swimwear: ['swimsuit', 'bikini', 'swim_shorts'],
  underwear_sleep: ['pajamas', 'robe', 'underwear'],
};
