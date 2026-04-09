require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Establishment = require('./models/Establishment');
const Product = require('./models/Product');
const Boost = require('./models/Boost');

const DEFAULT_HOURS = [
  { day: 'monday', open: '08:00', close: '20:00', closed: false },
  { day: 'tuesday', open: '08:00', close: '20:00', closed: false },
  { day: 'wednesday', open: '08:00', close: '20:00', closed: false },
  { day: 'thursday', open: '08:00', close: '20:00', closed: false },
  { day: 'friday', open: '08:00', close: '21:00', closed: false },
  { day: 'saturday', open: '08:00', close: '18:00', closed: false },
  { day: 'sunday', open: '09:00', close: '13:00', closed: false },
];

const ESTABLISHMENTS_DATA = [
  {
    name: 'Supermercado Bom Preço',
    description: 'Supermercado completo com hortifruti, açougue e padaria. Os melhores preços de Mogi das Cruzes!',
    category: 'supermarket',
    address: {
      street: 'Rua Irun', number: '123',
      neighborhood: 'Centro', city: 'Mogi das Cruzes', state: 'SP', zipCode: '08730-010',
      formatted: 'Rua Irun, 123 - Centro, Mogi das Cruzes - SP',
    },
    location: { type: 'Point', coordinates: [-46.1897, -23.5234] },
    phone: '(11) 4721-1234',
    logo: 'https://placehold.co/200x200/FF6B35/white?text=BP',
    coverImage: 'https://placehold.co/800x300/FF6B35/white?text=Supermercado+Bom+Preco',
    isSponsored: true,
    businessHours: DEFAULT_HOURS,
  },
  {
    name: 'Farmácia Saúde Total',
    description: 'Medicamentos, cosméticos, perfumaria e muito mais. Atendimento farmacêutico especializado.',
    category: 'pharmacy',
    address: {
      street: 'Avenida Vereador Narciso Yague Guimarães', number: '456',
      neighborhood: 'Vila Industrial', city: 'Mogi das Cruzes', state: 'SP', zipCode: '08730-020',
      formatted: 'Av. Vereador Narciso Y. Guimarães, 456 - Vila Industrial, Mogi das Cruzes - SP',
    },
    location: { type: 'Point', coordinates: [-46.1920, -23.5260] },
    phone: '(11) 4721-5678',
    logo: 'https://placehold.co/200x200/27AE60/white?text=ST',
    coverImage: 'https://placehold.co/800x300/27AE60/white?text=Farmacia+Saude+Total',
    isSponsored: true,
    businessHours: [
      ...DEFAULT_HOURS.slice(0, 6),
      { day: 'sunday', open: '08:00', close: '22:00', closed: false },
    ],
  },
  {
    name: 'Açougue do Zé',
    description: 'Carnes frescas selecionadas todos os dias. Bovino, suíno, frango e embutidos.',
    category: 'butcher',
    address: {
      street: 'Rua Coronel Souza Franco', number: '89',
      neighborhood: 'Jardim Irmãos Antunes', city: 'Mogi das Cruzes', state: 'SP', zipCode: '08730-050',
      formatted: 'Rua Coronel Souza Franco, 89 - Jardim Irmãos Antunes, Mogi das Cruzes - SP',
    },
    location: { type: 'Point', coordinates: [-46.1875, -23.5210] },
    phone: '(11) 4721-9012',
    logo: 'https://placehold.co/200x200/E74C3C/white?text=AZ',
    coverImage: 'https://placehold.co/800x300/E74C3C/white?text=Acougue+do+Ze',
    isSponsored: false,
    businessHours: [
      { day: 'monday', open: '07:00', close: '18:00', closed: false },
      { day: 'tuesday', open: '07:00', close: '18:00', closed: false },
      { day: 'wednesday', open: '07:00', close: '18:00', closed: false },
      { day: 'thursday', open: '07:00', close: '18:00', closed: false },
      { day: 'friday', open: '07:00', close: '18:00', closed: false },
      { day: 'saturday', open: '07:00', close: '14:00', closed: false },
      { day: 'sunday', open: '00:00', close: '00:00', closed: true },
    ],
  },
  {
    name: 'Padaria Pão Quente',
    description: 'Pães frescos, bolos, salgados e café da manhã completo. Tradição de 20 anos em Mogi.',
    category: 'bakery',
    address: {
      street: 'Rua Augusto Carlos Bauman', number: '234',
      neighborhood: 'Alto Ipiranga', city: 'Mogi das Cruzes', state: 'SP', zipCode: '08730-070',
      formatted: 'Rua Augusto Carlos Bauman, 234 - Alto Ipiranga, Mogi das Cruzes - SP',
    },
    location: { type: 'Point', coordinates: [-46.1950, -23.5180] },
    phone: '(11) 4721-3456',
    logo: 'https://placehold.co/200x200/F39C12/white?text=PQ',
    coverImage: 'https://placehold.co/800x300/F39C12/white?text=Padaria+Pao+Quente',
    isSponsored: true,
    businessHours: [
      { day: 'monday', open: '05:30', close: '20:00', closed: false },
      { day: 'tuesday', open: '05:30', close: '20:00', closed: false },
      { day: 'wednesday', open: '05:30', close: '20:00', closed: false },
      { day: 'thursday', open: '05:30', close: '20:00', closed: false },
      { day: 'friday', open: '05:30', close: '20:00', closed: false },
      { day: 'saturday', open: '05:30', close: '18:00', closed: false },
      { day: 'sunday', open: '06:00', close: '13:00', closed: false },
    ],
  },
  {
    name: 'Mercadinho 24h',
    description: 'Conveniência aberta 24 horas. Bebidas, snacks, higiene pessoal e muito mais.',
    category: 'convenience',
    address: {
      street: 'Av. Cézar de Souza', number: '678',
      neighborhood: 'Jundiapeba', city: 'Mogi das Cruzes', state: 'SP', zipCode: '08740-000',
      formatted: 'Av. Cézar de Souza, 678 - Jundiapeba, Mogi das Cruzes - SP',
    },
    location: { type: 'Point', coordinates: [-46.1840, -23.5300] },
    phone: '(11) 4721-7890',
    logo: 'https://placehold.co/200x200/9B59B6/white?text=24h',
    coverImage: 'https://placehold.co/800x300/9B59B6/white?text=Mercadinho+24h',
    isSponsored: false,
    businessHours: [
      { day: 'monday', open: '00:00', close: '23:59', closed: false },
      { day: 'tuesday', open: '00:00', close: '23:59', closed: false },
      { day: 'wednesday', open: '00:00', close: '23:59', closed: false },
      { day: 'thursday', open: '00:00', close: '23:59', closed: false },
      { day: 'friday', open: '00:00', close: '23:59', closed: false },
      { day: 'saturday', open: '00:00', close: '23:59', closed: false },
      { day: 'sunday', open: '00:00', close: '23:59', closed: false },
    ],
  },
  {
    name: 'Pet Shop Animal Love',
    description: 'Tudo para seu pet: ração, brinquedos, acessórios, banho e tosa. Veterinário on-site.',
    category: 'petshop',
    address: {
      street: 'Rua Doutor Deodoro', number: '321',
      neighborhood: 'Vila Moraes', city: 'Mogi das Cruzes', state: 'SP', zipCode: '08730-030',
      formatted: 'Rua Doutor Deodoro, 321 - Vila Moraes, Mogi das Cruzes - SP',
    },
    location: { type: 'Point', coordinates: [-46.1870, -23.5240] },
    phone: '(11) 4721-2222',
    logo: 'https://placehold.co/200x200/1ABC9C/white?text=AL',
    coverImage: 'https://placehold.co/800x300/1ABC9C/white?text=Pet+Shop+Animal+Love',
    isSponsored: false,
    businessHours: DEFAULT_HOURS,
  },
  {
    name: 'Restaurante Sabor da Terra',
    description: 'Comida caseira quentinha. Almoço executivo e a quilo. Especializados em culinária mineira.',
    category: 'restaurant',
    address: {
      street: 'Rua Voluntário Fernando Pinheiro Franco', number: '567',
      neighborhood: 'Mogi Moderno', city: 'Mogi das Cruzes', state: 'SP', zipCode: '08735-000',
      formatted: 'Rua Voluntário Fernando P. Franco, 567 - Mogi Moderno, Mogi das Cruzes - SP',
    },
    location: { type: 'Point', coordinates: [-46.1910, -23.5270] },
    phone: '(11) 4721-4444',
    logo: 'https://placehold.co/200x200/E67E22/white?text=ST',
    coverImage: 'https://placehold.co/800x300/E67E22/white?text=Restaurante+Sabor+da+Terra',
    isSponsored: false,
    businessHours: [
      { day: 'monday', open: '11:00', close: '15:00', closed: false },
      { day: 'tuesday', open: '11:00', close: '15:00', closed: false },
      { day: 'wednesday', open: '11:00', close: '15:00', closed: false },
      { day: 'thursday', open: '11:00', close: '15:00', closed: false },
      { day: 'friday', open: '11:00', close: '15:00', closed: false },
      { day: 'saturday', open: '11:00', close: '16:00', closed: false },
      { day: 'sunday', open: '00:00', close: '00:00', closed: true },
    ],
  },
  {
    name: 'Eletrônicos Tech Mogi',
    description: 'Smartphones, notebooks, TVs, eletrodomésticos e acessórios. Assistência técnica autorizada.',
    category: 'electronics',
    address: {
      street: 'Av. Ariovaldo de Almeida César', number: '890',
      neighborhood: 'Jardim Camila', city: 'Mogi das Cruzes', state: 'SP', zipCode: '08730-060',
      formatted: 'Av. Ariovaldo de Almeida César, 890 - Jardim Camila, Mogi das Cruzes - SP',
    },
    location: { type: 'Point', coordinates: [-46.1930, -23.5220] },
    phone: '(11) 4721-6666',
    logo: 'https://placehold.co/200x200/2980B9/white?text=TM',
    coverImage: 'https://placehold.co/800x300/2980B9/white?text=Eletronicos+Tech+Mogi',
    isSponsored: false,
    businessHours: DEFAULT_HOURS,
  },
  {
    name: 'Hortifruti Verde Campo',
    description: 'Frutas e verduras frescas direto do produtor. Entregamos em domicílio na região.',
    category: 'other',
    address: {
      street: 'Rua Barão de Jaceguai', number: '145',
      neighborhood: 'Vila Natal', city: 'Mogi das Cruzes', state: 'SP', zipCode: '08730-080',
      formatted: 'Rua Barão de Jaceguai, 145 - Vila Natal, Mogi das Cruzes - SP',
    },
    location: { type: 'Point', coordinates: [-46.1860, -23.5190] },
    phone: '(11) 4721-8888',
    logo: 'https://placehold.co/200x200/2ECC71/white?text=VC',
    coverImage: 'https://placehold.co/800x300/2ECC71/white?text=Hortifruti+Verde+Campo',
    isSponsored: false,
    businessHours: [
      { day: 'monday', open: '07:00', close: '19:00', closed: false },
      { day: 'tuesday', open: '07:00', close: '19:00', closed: false },
      { day: 'wednesday', open: '07:00', close: '19:00', closed: false },
      { day: 'thursday', open: '07:00', close: '19:00', closed: false },
      { day: 'friday', open: '07:00', close: '19:00', closed: false },
      { day: 'saturday', open: '06:00', close: '14:00', closed: false },
      { day: 'sunday', open: '00:00', close: '00:00', closed: true },
    ],
  },
];

const PRODUCTS_DATA = {
  'Supermercado Bom Preço': [
    { name: 'Arroz Branco 5kg', description: 'Arroz tipo 1, grãos selecionados', price: 24.90, category: 'Mercearia' },
    { name: 'Feijão Carioca 1kg', description: 'Feijão carioca tipo 1', price: 8.90, category: 'Mercearia' },
    { name: 'Óleo de Soja 900ml', description: 'Óleo de soja refinado', price: 6.49, category: 'Mercearia' },
    { name: 'Leite Integral 1L', description: 'Leite UHT integral', price: 4.99, category: 'Laticínios' },
    { name: 'Frango Inteiro (kg)', description: 'Frango resfriado por kg', price: 9.90, category: 'Carnes' },
    { name: 'Macarrão Espaguete 500g', description: 'Macarrão de sêmola', price: 3.49, category: 'Mercearia' },
    { name: 'Café Torrado 500g', description: 'Café moído tradicional', price: 12.90, category: 'Mercearia' },
    { name: 'Açúcar Cristal 1kg', description: 'Açúcar cristal refinado', price: 4.29, category: 'Mercearia' },
  ],
  'Farmácia Saúde Total': [
    { name: 'Dipirona 500mg 20cp', description: 'Analgésico e antitérmico', price: 8.90, category: 'Medicamentos' },
    { name: 'Vitamina C 1g 10cp', description: 'Suplemento vitamínico efervescente', price: 12.50, category: 'Vitaminas' },
    { name: 'Protetor Solar FPS 50 200ml', description: 'Protetor solar facial e corporal', price: 32.90, category: 'Dermocosmético' },
    { name: 'Shampoo Anticaspa 400ml', description: 'Shampoo com zinco piritiona', price: 18.90, category: 'Higiene' },
    { name: 'Termômetro Digital', description: 'Termômetro axilar digital com beep', price: 24.90, category: 'Equipamentos' },
    { name: 'Fralda Descartável P (32un)', description: 'Fraldas para bebês até 6kg', price: 39.90, category: 'Bebê' },
    { name: 'Álcool Gel 70% 500ml', description: 'Antisséptico para mãos', price: 9.90, category: 'Higiene' },
  ],
  'Açougue do Zé': [
    { name: 'Picanha Bovina (kg)', description: 'Picanha com gordura, selecionar ao pedir', price: 65.90, category: 'Bovino' },
    { name: 'Costela Bovina (kg)', description: 'Costela para churrasco', price: 35.90, category: 'Bovino' },
    { name: 'Fraldinha (kg)', description: 'Corte macio, ótimo para churrasco', price: 45.90, category: 'Bovino' },
    { name: 'Linguiça Toscana (kg)', description: 'Linguiça artesanal temperada', price: 22.90, category: 'Embutidos' },
    { name: 'Peito de Frango (kg)', description: 'Peito sem osso e sem pele', price: 14.90, category: 'Frango' },
    { name: 'Bisteca Suína (kg)', description: 'Bisteca de porco fresca', price: 19.90, category: 'Suíno' },
    { name: 'Coxão Mole (kg)', description: 'Ideal para assados e bifes', price: 39.90, category: 'Bovino' },
    { name: 'Acém (kg)', description: 'Corte bovino para ensopados', price: 28.90, category: 'Bovino' },
  ],
  'Padaria Pão Quente': [
    { name: 'Pão Francês (kg)', description: 'Pão francês tradicional, saindo quentinho', price: 12.90, category: 'Pães' },
    { name: 'Croissant de Queijo', description: 'Croissant folhado com queijo minas', price: 6.50, category: 'Salgados' },
    { name: 'Bolo de Cenoura Fatia', description: 'Bolo de cenoura com cobertura de chocolate', price: 7.90, category: 'Bolos' },
    { name: 'Coxinha de Frango', description: 'Coxinha tradicional com catupiry', price: 5.90, category: 'Salgados' },
    { name: 'Pão de Queijo (6 un)', description: 'Pão de queijo mineiro tradicional', price: 8.90, category: 'Pães' },
    { name: 'Café com Leite 300ml', description: 'Café fresquinho com leite', price: 5.00, category: 'Bebidas' },
    { name: 'Esfiha de Carne (un)', description: 'Esfiha com carne temperada', price: 4.50, category: 'Salgados' },
  ],
  'Mercadinho 24h': [
    { name: 'Refrigerante Cola 2L', description: 'Refrigerante gelado 2L', price: 8.99, category: 'Bebidas' },
    { name: 'Cerveja Lata 350ml', description: 'Cerveja pilsen gelada', price: 3.99, category: 'Bebidas' },
    { name: 'Salgadinho Batata 100g', description: 'Salgadinho de batata sabor original', price: 4.99, category: 'Snacks' },
    { name: 'Chocolate ao Leite 100g', description: 'Tablete de chocolate ao leite', price: 5.99, category: 'Doces' },
    { name: 'Água Mineral 500ml', description: 'Água mineral sem gás gelada', price: 2.50, category: 'Bebidas' },
    { name: 'Cigarro Pack', description: 'Maço de cigarros - diversas marcas', price: 11.00, category: 'Outros' },
    { name: 'Sabonete em Barra', description: 'Sabonete antibacteriano', price: 3.50, category: 'Higiene' },
  ],
  'Pet Shop Animal Love': [
    { name: 'Ração Seca Cão Adulto 15kg', description: 'Ração balanceada para cães adultos', price: 89.90, category: 'Ração' },
    { name: 'Ração Gato Adulto 3kg', description: 'Ração premium para gatos', price: 39.90, category: 'Ração' },
    { name: 'Coleira Antipulgas P/M', description: 'Coleira antiparasita 8 meses', price: 45.90, category: 'Saúde' },
    { name: 'Areia para Gatos 4kg', description: 'Areia sanitária aglomerante', price: 22.90, category: 'Higiene' },
    { name: 'Brinquedo Mordedor Cão', description: 'Mordedor de borracha resistente', price: 18.90, category: 'Brinquedos' },
    { name: 'Shampoo Pet Neutro 500ml', description: 'Shampoo hipoalergênico para pets', price: 24.90, category: 'Higiene' },
  ],
  'Restaurante Sabor da Terra': [
    { name: 'Prato Feito Completo', description: 'Arroz, feijão, salada, proteína e suco', price: 19.90, category: 'Almoço' },
    { name: 'Frango à Parmegiana', description: 'Filé de frango com molho de tomate e queijo', price: 28.90, category: 'Pratos' },
    { name: 'Feijoada Completa', description: 'Feijoada tradicional com acompanhamentos - sextas', price: 35.90, category: 'Pratos' },
    { name: 'Buffet por Kg', description: 'Saladas, massas, carnes e acompanhamentos', price: 52.90, category: 'Almoço' },
    { name: 'Suco de Fruta Natural 300ml', description: 'Suco natural de frutas da estação', price: 8.90, category: 'Bebidas' },
    { name: 'Pudim de Leite', description: 'Pudim caseiro com calda de caramelo', price: 9.90, category: 'Sobremesas' },
  ],
  'Eletrônicos Tech Mogi': [
    { name: 'Fone Bluetooth', description: 'Fone de ouvido sem fio com cancelamento de ruído', price: 149.90, category: 'Áudio' },
    { name: 'Carregador USB-C 65W', description: 'Carregador rápido universal', price: 79.90, category: 'Acessórios' },
    { name: 'Cabo USB-C 2m', description: 'Cabo de dados e carga reforçado', price: 29.90, category: 'Acessórios' },
    { name: 'Película Protetora Universal', description: 'Película de vidro temperado 9H', price: 19.90, category: 'Acessórios' },
    { name: 'Mouse sem fio', description: 'Mouse wireless com bateria recarregável', price: 89.90, category: 'Informática' },
    { name: 'Pendrive 64GB', description: 'Pendrive USB 3.0 compacto', price: 49.90, category: 'Informática' },
    { name: 'Smartwatch Fitness', description: 'Relógio inteligente com monitor cardíaco', price: 299.90, category: 'Wearables' },
  ],
  'Hortifruti Verde Campo': [
    { name: 'Tomate (kg)', description: 'Tomate italiano fresco', price: 5.90, category: 'Legumes' },
    { name: 'Alface Crespa (un)', description: 'Alface hidropônica', price: 3.90, category: 'Verduras' },
    { name: 'Banana Prata (kg)', description: 'Banana prata madura', price: 4.90, category: 'Frutas' },
    { name: 'Maçã Fuji (kg)', description: 'Maçã fuji importada', price: 9.90, category: 'Frutas' },
    { name: 'Cenoura (kg)', description: 'Cenoura baby fresca', price: 4.50, category: 'Legumes' },
    { name: 'Limão Taiti (kg)', description: 'Limão taiti suculento', price: 6.90, category: 'Frutas' },
    { name: 'Brócolis (un)', description: 'Brócolis orgânico', price: 5.90, category: 'Verduras' },
    { name: 'Morango (bandeja 300g)', description: 'Morangos frescos da serra', price: 12.90, category: 'Frutas' },
  ],
};

async function seedData() {
  console.log('🌱 Starting seed...');

  // Create owner user
  const owner = await User.create({
    name: 'João Silva - Proprietário Demo',
    email: 'owner@pertodemim.com.br',
    password: 'demo123456',
    role: 'owner',
  });

  // Create consumer user
  await User.create({
    name: 'Maria Consumer Demo',
    email: 'consumer@pertodemim.com.br',
    password: 'demo123456',
    role: 'consumer',
  });

  console.log('👥 Users created');

  // Create establishments
  const sponsoredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  for (const estData of ESTABLISHMENTS_DATA) {
    const establishment = await Establishment.create({
      ...estData,
      ownerId: owner._id,
      sponsoredUntil: estData.isSponsored ? sponsoredUntil : undefined,
    });

    // Create products for this establishment
    const products = PRODUCTS_DATA[estData.name] || [];
    for (const productData of products) {
      await Product.create({
        ...productData,
        establishmentId: establishment._id,
      });
    }

    console.log(`✅ Created: ${estData.name} with ${products.length} products`);
  }

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📧 Demo accounts:');
  console.log('   Owner: owner@pertodemim.com.br / demo123456');
  console.log('   Consumer: consumer@pertodemim.com.br / demo123456');
}

async function seedIfEmpty() {
  try {
    const count = await Establishment.countDocuments();
    if (count === 0) {
      console.log('📭 Database is empty, running seed...');
      await seedData();
    } else {
      console.log(`📦 Database has ${count} establishments, skipping seed`);
    }
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  }
}

// Allow running directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pertodemim?replicaSet=rs0')
    .then(async () => {
      console.log('Connected to MongoDB');
      await User.deleteMany({});
      await Establishment.deleteMany({});
      await Product.deleteMany({});
      await Boost.deleteMany({});
      await seedData();
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedIfEmpty, seedData };
