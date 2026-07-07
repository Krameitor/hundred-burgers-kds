// menu-data.js — Carta completa de Hundred Burgers

const MENU = {
  burgers: [
    { id: 'singular', name: 'Singular', desc: 'Dry aged, cheddar, bacon, cebolla caramelizada, camembert, BBQ de mamá', price: 12.90 },
    { id: 'hundred', name: 'Hundred', desc: 'Dry aged, cheddar, iceberg, tomate, cebolla relish, pepinillos, salsa secreta', price: 11.50 },
    { id: 'satisfaction', name: 'Satisfaction', desc: '2×120g dry aged, doble cheddar, doble bacon, smokey mayo', price: 13.90 },
    { id: 'animal-style', name: 'Animal Style', desc: 'Dry aged, cheddar, bacon, pulled pork, BBQ de mamá, cebolla rosa', price: 13.50 },
    { id: 'loser', name: 'Loser', desc: 'Dry aged, cheddar, cebolla caramelizada, salsa coreana gochujang', price: 12.50 },
    { id: 'carlton-banks', name: 'Carlton Banks', desc: 'Crispy chicken, cheddar, iceberg, bacon, smokey mayo', price: 12.50 },
    { id: 'veggie', name: 'Veggie Burger', desc: 'Beyond Burger, guacamole, pico de gallo, vegan mayo', price: 11.90 },
    { id: 'superiority', name: 'Superiority Burger', desc: 'Quinoa, verduras, garbanzos, guacamole, vegan mayo', price: 11.90 },
  ],
  sides: [
    { id: 'patatas', name: 'Patatas Fritas', desc: 'Crujientes, receta propia', price: 4.50 },
    { id: 'sweet-potatoes', name: 'Sweet Potatoes', desc: 'Batatas dulces fritas', price: 5.00 },
    { id: 'bacon-cheese-fries', name: 'Bacon Cheese Fries', desc: 'Patatas con queso fundido y bacon', price: 6.50 },
    { id: 'pulled-pork-fries', name: 'Pulled Pork Fries', desc: 'Patatas con pulled pork y cebolla rosa', price: 7.00 },
    { id: 'nachos', name: 'Nachos', desc: 'Con guacamole', price: 6.00 },
    { id: 'nachos-all-in', name: 'Nachos All In', desc: 'Con cochinita pibil', price: 8.50 },
    { id: 'bbq-ribs', name: 'BBQ Ribs', desc: 'Costillas a baja temperatura', price: 14.90 },
  ],
  kids: [
    { id: 'kids-burger', name: 'Kids Burger Menu', desc: 'Cheeseburger con ketchup y patatas', price: 8.50 },
    { id: 'kids-nuggets', name: 'Kids Nuggets', desc: 'Nuggets de pollo con patatas', price: 7.50 },
  ],
  postres: [
    { id: 'cheesecake-lotus', name: 'Cheesecake Lotus', desc: 'Tarta de queso con galleta Lotus', price: 6.00 },
    { id: 'cheesecake-pb', name: 'Cheesecake Peanut Butter', desc: 'Tarta de queso con crema de cacahuete', price: 6.00 },
    { id: 'cheesecake-kinder', name: 'Cheesecake Kinder', desc: 'Tarta de queso con Kinder Bueno', price: 6.00 },
    { id: 'chocolate-pie', name: 'Chocolate Pie', desc: 'Tarta de chocolate caliente', price: 5.50 },
    { id: 'cookie', name: 'Cookie', desc: 'Cookie artesanal del día', price: 3.50 },
  ],
  bebidas: [
    { id: 'cream-ale', name: 'HUNDRED Cream Ale', desc: 'Cerveza artesanal de la casa', price: 4.50 },
    { id: 'ipa', name: 'HUNDRED IPA', desc: 'IPA artesanal de la casa', price: 5.00 },
    { id: 'cerveza-clasica', name: 'Cerveza Clásica', desc: 'Caña o botella', price: 3.50 },
    { id: 'vino-tinto', name: 'Vino Tinto', desc: 'Copa de vino tinto de la casa', price: 4.00 },
    { id: 'vino-blanco', name: 'Vino Blanco', desc: 'Copa de vino blanco de la casa', price: 4.00 },
    { id: 'refresco', name: 'Refresco', desc: 'Coca-Cola, Fanta, agua', price: 2.80 },
  ],
};

const MENU_CATEGORIES = [
  { key: 'burgers', label: '🍔 Burgers', emoji: '🍔' },
  { key: 'sides', label: '🍟 Sides', emoji: '🍟' },
  { key: 'kids', label: '🧒 Kids', emoji: '🧒' },
  { key: 'postres', label: '🍰 Postres', emoji: '🍰' },
  { key: 'bebidas', label: '🍺 Bebidas', emoji: '🍺' },
];

// Flat list for easy lookup
const MENU_ALL = Object.values(MENU).flat();

function getItemById(id) {
  return MENU_ALL.find(item => item.id === id);
}
