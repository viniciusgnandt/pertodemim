require('dotenv').config();
const mongoose = require('mongoose');

const PRODUCTS = {
  bakery: [
    { name: 'Pão Francês', description: 'Pão crocante por fora e macio por dentro, assado no momento', price: 0.75, category: 'Pães' },
    { name: 'Pão de Queijo', description: 'Pão de queijo mineiro tradicional, quentinho', price: 3.50, category: 'Pães' },
    { name: 'Croissant de Manteiga', description: 'Croissant folhado com manteiga importada', price: 7.90, category: 'Pães' },
    { name: 'Bolo de Cenoura com Chocolate', description: 'Fatia generosa do clássico bolo de cenoura com cobertura de brigadeiro', price: 8.50, category: 'Bolos' },
    { name: 'Coxinha de Frango', description: 'Coxinha crocante recheada com frango desfiado temperado', price: 5.50, category: 'Salgados' },
    { name: 'Esfiha de Carne', description: 'Esfiha aberta com carne moída e temperos', price: 4.90, category: 'Salgados' },
    { name: 'Café Expresso', description: 'Café expresso encorpado e aromático', price: 4.00, category: 'Bebidas' },
    { name: 'Cappuccino', description: 'Cappuccino cremoso com canela', price: 8.00, category: 'Bebidas' },
    { name: 'Misto Quente', description: 'Sanduíche de presunto e queijo grelhado', price: 9.90, category: 'Lanches' },
    { name: 'Brigadeiro', description: 'Brigadeiro artesanal de chocolate belga', price: 3.50, category: 'Doces' },
  ],
  restaurant: [
    { name: 'Prato Feito (PF)', description: 'Arroz, feijão, salada, proteína e acompanhamento do dia', price: 22.90, category: 'Pratos' },
    { name: 'Frango Grelhado', description: 'Filé de frango grelhado com legumes e arroz integral', price: 32.90, category: 'Pratos' },
    { name: 'Picanha na Brasa', description: 'Picanha grelhada na brasa, servida com farofa e vinagrete', price: 59.90, category: 'Pratos' },
    { name: 'Macarrão ao Molho Bolonhesa', description: 'Espaguete com molho bolonhesa caseiro e parmesão', price: 35.90, category: 'Massas' },
    { name: 'Pizza Margherita (M)', description: 'Pizza de molho de tomate, mozzarella e manjericão fresco', price: 42.90, category: 'Pizzas' },
    { name: 'Pizza Calabresa (M)', description: 'Pizza de calabresa fatiada com cebola e azeitona', price: 44.90, category: 'Pizzas' },
    { name: 'Hambúrguer Artesanal', description: 'Blend 180g, queijo cheddar, alface, tomate e molho especial', price: 38.90, category: 'Lanches' },
    { name: 'Refrigerante Lata', description: 'Coca-Cola, Guaraná ou Sprite 350ml', price: 6.00, category: 'Bebidas' },
    { name: 'Suco Natural', description: 'Suco de laranja, limão ou maracujá 300ml', price: 9.90, category: 'Bebidas' },
    { name: 'Pudim de Leite', description: 'Pudim caseiro de leite condensado com calda de caramelo', price: 12.90, category: 'Sobremesas' },
  ],
  pharmacy: [
    { name: 'Dipirona 500mg (10 comp)', description: 'Analgésico e antitérmico genérico', price: 4.90, category: 'Medicamentos' },
    { name: 'Vitamina C 1g (10 comp)', description: 'Vitamina C efervescente sabor laranja', price: 12.90, category: 'Vitaminas' },
    { name: 'Protetor Solar FPS 50 (50ml)', description: 'Protetor solar facial sem gordura, FPS 50', price: 34.90, category: 'Dermocosméticos' },
    { name: 'Termômetro Digital', description: 'Termômetro digital com alarme sonoro e display LCD', price: 29.90, category: 'Equipamentos' },
    { name: 'Álcool Gel 70% (500ml)', description: 'Álcool gel antisséptico 70% com hidratante', price: 9.90, category: 'Higiene' },
    { name: 'Shampoo Anticaspa (200ml)', description: 'Shampoo Head & Shoulders anticaspa', price: 19.90, category: 'Higiene' },
    { name: 'Curativo Adesivo (cx 10un)', description: 'Curativo adesivo estéril impermeável', price: 8.90, category: 'Primeiros Socorros' },
    { name: 'Complexo B (60 comp)', description: 'Suplemento vitamínico do complexo B', price: 14.90, category: 'Vitaminas' },
    { name: 'Pomada Bepantol (30g)', description: 'Pomada cicatrizante e hidratante', price: 22.90, category: 'Dermocosméticos' },
    { name: 'Colírio Lacrima (10ml)', description: 'Colírio lubrificante para olhos secos', price: 18.90, category: 'Medicamentos' },
  ],
  supermarket: [
    { name: 'Arroz Branco 5kg', description: 'Arroz tipo 1 cozinha rápida', price: 24.90, category: 'Grãos' },
    { name: 'Feijão Carioca 1kg', description: 'Feijão carioca selecionado tipo 1', price: 8.90, category: 'Grãos' },
    { name: 'Açúcar Cristal 5kg', description: 'Açúcar cristal refinado', price: 19.90, category: 'Básicos' },
    { name: 'Óleo de Soja 900ml', description: 'Óleo de soja refinado', price: 7.90, category: 'Básicos' },
    { name: 'Leite Integral 1L', description: 'Leite UHT integral', price: 5.49, category: 'Laticínios' },
    { name: 'Ovos Caipira (dz)', description: 'Dúzia de ovos caipira selecionados', price: 14.90, category: 'Laticínios' },
    { name: 'Macarrão Espaguete 500g', description: 'Macarrão espaguete grano duro', price: 4.90, category: 'Massas' },
    { name: 'Detergente Líquido 500ml', description: 'Detergente neutro lava-louças', price: 3.49, category: 'Limpeza' },
    { name: 'Papel Higiênico (4 rolos)', description: 'Papel higiênico folha dupla macia', price: 7.90, category: 'Higiene' },
    { name: 'Frango Inteiro (kg)', description: 'Frango inteiro resfriado, preço por kg', price: 11.90, category: 'Carnes' },
    { name: 'Banana Prata (kg)', description: 'Banana prata fresca, preço por kg', price: 5.90, category: 'Hortifruti' },
    { name: 'Refrigerante 2L', description: 'Coca-Cola, Pepsi ou Guaraná 2 litros', price: 9.90, category: 'Bebidas' },
  ],
  convenience: [
    { name: 'Água Mineral 500ml', description: 'Água mineral sem gás gelada', price: 3.50, category: 'Bebidas' },
    { name: 'Energético Lata 250ml', description: 'Energético Red Bull ou Monster 250ml', price: 12.90, category: 'Bebidas' },
    { name: 'Sanduíche Natural', description: 'Sanduíche de frango ou atum com salada', price: 14.90, category: 'Lanches' },
    { name: 'Barra de Cereal', description: 'Barra de cereal integral com granola', price: 4.50, category: 'Snacks' },
    { name: 'Salgadinho 100g', description: 'Chips de batata ou cheetos 100g', price: 6.90, category: 'Snacks' },
    { name: 'Chocolate ao Leite 40g', description: 'Barra de chocolate ao leite Nestlé ou Lacta', price: 4.90, category: 'Doces' },
    { name: 'Cigarro (maço)', description: 'Marlboro, Derby ou Parliament', price: 12.00, category: 'Tabaco' },
    { name: 'Isqueiro Bic', description: 'Isqueiro descartável BIC', price: 4.90, category: 'Utilidades' },
    { name: 'Paracetamol 750mg (4 comp)', description: 'Analgésico de venda livre', price: 3.90, category: 'Saúde' },
    { name: 'Preservativo (cx 3un)', description: 'Preservativo masculino látex', price: 8.90, category: 'Saúde' },
  ],
  petshop: [
    { name: 'Ração Cão Adulto 3kg', description: 'Ração premium para cães adultos Pedigree ou Purina', price: 49.90, category: 'Alimentação' },
    { name: 'Ração Gato Adulto 1kg', description: 'Ração premium para gatos adultos Whiskas', price: 24.90, category: 'Alimentação' },
    { name: 'Petisco Ossinho Cão', description: 'Petisco mastigável para higiene dental canina', price: 12.90, category: 'Petiscos' },
    { name: 'Coleira Anti-Pulgas', description: 'Coleira antipulgas e carrapatos 8 meses de proteção', price: 39.90, category: 'Saúde Animal' },
    { name: 'Shampoo Pet 500ml', description: 'Shampoo hipoalergênico para cães e gatos', price: 28.90, category: 'Higiene' },
    { name: 'Caixa de Transporte P', description: 'Caixa de transporte para pets até 6kg', price: 89.90, category: 'Acessórios' },
    { name: 'Brinquedo Mordedor', description: 'Brinquedo de borracha resistente para cães', price: 19.90, category: 'Brinquedos' },
    { name: 'Areia Higiênica Gato 2kg', description: 'Areia sanitária granulada com neutralizador de odores', price: 14.90, category: 'Higiene' },
    { name: 'Consulta Veterinária', description: 'Consulta veterinária clínica geral', price: 120.00, category: 'Serviços' },
    { name: 'Banho e Tosa Pequeno Porte', description: 'Banho, tosa e perfume para cães de pequeno porte', price: 65.00, category: 'Serviços' },
  ],
  butcher: [
    { name: 'Picanha Bovina (kg)', description: 'Picanha bovina fresca, corte especial, preço por kg', price: 79.90, category: 'Bovinos' },
    { name: 'Fraldinha (kg)', description: 'Fraldinha bovina para churrasco, preço por kg', price: 49.90, category: 'Bovinos' },
    { name: 'Costela Bovina (kg)', description: 'Costela bovina para assado ou churrasco, por kg', price: 39.90, category: 'Bovinos' },
    { name: 'Contrafilé (kg)', description: 'Contrafilé maturado para bifes, por kg', price: 44.90, category: 'Bovinos' },
    { name: 'Frango Inteiro (kg)', description: 'Frango caipira inteiro resfriado, por kg', price: 14.90, category: 'Aves' },
    { name: 'Coxa e Sobrecoxa (kg)', description: 'Coxa e sobrecoxa de frango frescas, por kg', price: 10.90, category: 'Aves' },
    { name: 'Linguiça Toscana (kg)', description: 'Linguiça toscana artesanal temperada, por kg', price: 28.90, category: 'Embutidos' },
    { name: 'Carne Moída Patinho (kg)', description: 'Carne moída de patinho, moída na hora, por kg', price: 34.90, category: 'Bovinos' },
    { name: 'Lombo Suíno (kg)', description: 'Lombo suíno inteiro para assar, por kg', price: 22.90, category: 'Suínos' },
    { name: 'Bacon Fatiado 200g', description: 'Bacon defumado fatiado premium', price: 18.90, category: 'Embutidos' },
  ],
  clothing: [
    { name: 'Camiseta Básica', description: 'Camiseta 100% algodão, diversas cores', price: 39.90, category: 'Feminino' },
    { name: 'Calça Jeans Feminina', description: 'Calça jeans skinny com elastano', price: 129.90, category: 'Feminino' },
    { name: 'Vestido Casual', description: 'Vestido floral leve para o dia a dia', price: 89.90, category: 'Feminino' },
    { name: 'Camiseta Polo Masculina', description: 'Polo masculina piquet manga curta', price: 59.90, category: 'Masculino' },
    { name: 'Bermuda Moletom', description: 'Bermuda de moletom confortável', price: 69.90, category: 'Masculino' },
    { name: 'Tênis Casual', description: 'Tênis casual unissex confortável', price: 149.90, category: 'Calçados' },
    { name: 'Bolsa Feminina', description: 'Bolsa de couro sintético com alça ajustável', price: 99.90, category: 'Acessórios' },
    { name: 'Cinto de Couro', description: 'Cinto masculino de couro legítimo', price: 49.90, category: 'Acessórios' },
    { name: 'Meia Kit 3 pares', description: 'Kit 3 pares de meias cano curto', price: 24.90, category: 'Básicos' },
    { name: 'Jaqueta Jeans', description: 'Jaqueta jeans masculina estilo casual', price: 179.90, category: 'Masculino' },
  ],
  electronics: [
    { name: 'Cabo USB-C 1m', description: 'Cabo de carregamento USB-C de alta velocidade', price: 29.90, category: 'Cabos' },
    { name: 'Carregador Rápido 65W', description: 'Carregador turbo 65W com USB-C GaN', price: 89.90, category: 'Carregadores' },
    { name: 'Fone de Ouvido Bluetooth', description: 'Fone intra-auricular sem fio com cancelamento de ruído', price: 149.90, category: 'Áudio' },
    { name: 'Película Protetora Universal', description: 'Película de vidro temperado 9H para smartphones', price: 19.90, category: 'Proteção' },
    { name: 'Power Bank 10000mAh', description: 'Bateria portátil 10000mAh com 2 saídas USB', price: 99.90, category: 'Baterias' },
    { name: 'Suporte Veicular Magnético', description: 'Suporte magnético para celular no carro', price: 34.90, category: 'Acessórios' },
    { name: 'Mouse Sem Fio', description: 'Mouse óptico sem fio 2.4GHz ergonômico', price: 59.90, category: 'Informática' },
    { name: 'Teclado USB', description: 'Teclado ABNT2 USB slim silencioso', price: 79.90, category: 'Informática' },
    { name: 'Capa para Smartphone', description: 'Capa silicone antichoque para celular', price: 24.90, category: 'Proteção' },
    { name: 'Lâmpada LED 9W', description: 'Lâmpada LED 9W bivolt luz branca ou amarela', price: 12.90, category: 'Iluminação' },
  ],
  other: [
    { name: 'Serviço de Consulta', description: 'Consulta especializada com profissional qualificado', price: 80.00, category: 'Serviços' },
    { name: 'Pacote Mensal', description: 'Pacote de serviços mensais com desconto especial', price: 199.90, category: 'Planos' },
    { name: 'Produto Especial', description: 'Produto exclusivo da nossa loja', price: 49.90, category: 'Geral' },
  ],
};

async function seedProducts() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pertoDeMim';
  await mongoose.connect(uri);
  console.log('✅ Conectado ao MongoDB');

  const db = mongoose.connection.db;
  const Product = require('./models/Product');

  // Remove produtos existentes
  const deleted = await Product.deleteMany({});
  console.log(`🗑️  Removidos ${deleted.deletedCount} produtos existentes`);

  const establishments = await db.collection('establishments')
    .find({}, { projection: { _id: 1, name: 1, category: 1 } })
    .toArray();

  console.log(`📦 Cadastrando produtos para ${establishments.length} estabelecimentos...`);

  let total = 0;
  const docs = [];

  for (const est of establishments) {
    const pool = PRODUCTS[est.category] || PRODUCTS.other;
    // Pega 4-7 produtos aleatórios do pool
    const count = 4 + Math.floor(Math.random() * 4);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));

    for (const p of shuffled) {
      // Varia o preço levemente (+/- 15%)
      const variance = 0.85 + Math.random() * 0.30;
      docs.push({
        name: p.name,
        description: p.description,
        price: Math.round(p.price * variance * 100) / 100,
        category: p.category,
        establishmentId: est._id,
        isActive: true,
      });
      total++;
    }
  }

  await Product.insertMany(docs);
  console.log(`✅ ${total} produtos cadastrados em ${establishments.length} estabelecimentos`);
  process.exit(0);
}

seedProducts().catch(e => { console.error('❌', e.message); process.exit(1); });
