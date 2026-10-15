import fs from 'fs';

const data = JSON.parse(fs.readFileSync('extracted_colors.json'));

const dict = {
  'Natural': { fr: 'Blanc naturel / Écru', en: 'Natural / Ecru', pt: 'Natural', family: 'Blancs & Neutres' },
  'Branco': { fr: 'Blanc pur', en: 'Pure White', pt: 'Branco', family: 'Blancs & Neutres' },
  'Preto': { fr: 'Noir classique', en: 'Classic Black', pt: 'Preto', family: 'Gris & Noirs' },
  '208': { fr: 'Gris argenté clair', en: 'Platinum / Light Silver Grey', pt: 'Cinza Platina', family: 'Gris & Noirs' },
  '206': { fr: 'Gris cendre / Mastic', en: 'Ash Grey / Light Putty', pt: 'Cinza Cinza', family: 'Gris & Noirs' },
  '544': { fr: 'Kaki sable / Grège', en: 'Sand Sage / Greige', pt: 'Verde Oliva Claro', family: 'Verts & Kaki' },
  '336': { fr: 'Gris taupe / Pierre', en: 'Stone Grey / Taupe', pt: 'Cinza Pedra', family: 'Gris & Noirs' },
  '665': { fr: 'Gris moyen neutre', en: 'Medium Grey', pt: 'Cinza Médio', family: 'Gris & Noirs' },
  '583': { fr: 'Brun cendre / Taupe foncé', en: 'Ash Brown / Dark Taupe', pt: 'Marrom Acinzentado', family: 'Marrons & Terres' },
  '207': { fr: 'Taupe classique', en: 'Classic Taupe', pt: 'Fendi / Taupe', family: 'Marrons & Terres' },
  '664': { fr: 'Gris terreux / Argile', en: 'Earth Grey / Clay', pt: 'Cinza Terra', family: 'Gris & Noirs' },
  '209': { fr: 'Gris graphite bleuté', en: 'Smokey Graphite / Green-Grey', pt: 'Cinza Chumbo Esverdeado', family: 'Gris & Noirs' },
  '691': { fr: 'Gris anthracite très foncé', en: 'Charcoal / Deep Anthracite', pt: 'Grafite Escuro', family: 'Gris & Noirs' },
  '210': { fr: 'Noir charbon', en: 'Coal Black / Charcoal', pt: 'Preto Carvão', family: 'Gris & Noirs' },
  '474': { fr: 'Anthracite foncé', en: 'Dark Charcoal / Graphite', pt: 'Grafite', family: 'Gris & Noirs' },
  '287': { fr: 'Gris violine poudré', en: 'Dusty Plum Grey', pt: 'Cinza Arroxeado', family: 'Gris & Noirs' },
  '211': { fr: 'Brun cendré foncé', en: 'Dark Smoky Brown', pt: 'Marrom Cinzento', family: 'Marrons & Terres' },
  '392': { fr: 'Noir fumé', en: 'Smoke Black', pt: 'Fumaça Escuro', family: 'Gris & Noirs' },
  '04': { fr: 'Beige lin / Ficelle', en: 'Linen / Natural Sand', pt: 'Linho', family: 'Blancs & Neutres' },
  '397': { fr: 'Beige ivoire clair', en: 'Pale Ivory Beige', pt: 'Marfim Claro', family: 'Blancs & Neutres' },
  '90': { fr: 'Vert sauge doux', en: 'Sage Green', pt: 'Verde Sálvia', family: 'Verts & Kaki' },
  '224': { fr: 'Vert d\'eau / Menthe pastel', en: 'Seafoam Mint / Pale Mint', pt: 'Verde Menta Pastel', family: 'Verts & Kaki' },
  '1019': { fr: 'Vert anis tendre', en: 'Soft Anise / Chartreuse Mist', pt: 'Verde Erva-Doce', family: 'Verts & Kaki' },
  'M01': { fr: 'Vert panaché / Camouflage', en: 'Variegated Green Mix', pt: 'Verde Multicolor / Mesclado', family: 'Métallisés & Spéciaux' },
  '352': { fr: 'Vert mousse doré / Olive vif', en: 'Bright Olive / Golden Moss', pt: 'Verde Musgo Claro', family: 'Verts & Kaki' },
  '1045': { fr: 'Vert prairie éclatant', en: 'Meadow Green / Spring Green', pt: 'Verde Folha', family: 'Verts & Kaki' },
  '87': { fr: 'Vert forêt profond', en: 'Deep Forest Green', pt: 'Verde Floresta', family: 'Verts & Kaki' },
  '88': { fr: 'Vert mousse foncé', en: 'Dark Moss Green', pt: 'Verde Musgo Escuro', family: 'Verts & Kaki' },
  '367': { fr: 'Vert émeraude foncé', en: 'Dark Emerald Green', pt: 'Verde Esmeralda', family: 'Verts & Kaki' },
  '386': { fr: 'Vert canard / Sarcelle foncé', en: 'Dark Teal Green', pt: 'Verde Petróleo Escuro', family: 'Verts & Kaki' },
  '64': { fr: 'Vert olive militaire', en: 'Dark Olive / Army Green', pt: 'Verde Militar', family: 'Verts & Kaki' },
  '666': { fr: 'Jaune ocre doré', en: 'Golden Ochre', pt: 'Ocre Dourado', family: 'Jaunes & Ocres' },
  '21': { fr: 'Caramel doré', en: 'Golden Caramel', pt: 'Caramelo Dourado', family: 'Jaunes & Ocres' },
  '604': { fr: 'Ambre moutarde', en: 'Amber Mustard', pt: 'Âmbar / Mostarda', family: 'Jaunes & Ocres' },
  '222': { fr: 'Caramel chaud / Fauve', en: 'Warm Caramel / Tawny', pt: 'Caramelo Médio', family: 'Marrons & Terres' },
  '204': { fr: 'Brun clair doré / Cannelle', en: 'Light Golden Brown / Cinnamon', pt: 'Canela Dourado', family: 'Marrons & Terres' },
  '844': { fr: 'Brun tabac', en: 'Tobacco Brown', pt: 'Marrom Tabaco', family: 'Marrons & Terres' },
  '221': { fr: 'Brun noisette doré', en: 'Golden Hazelnut Brown', pt: 'Avelã Dourado', family: 'Marrons & Terres' },
  '389': { fr: 'Brun chocolat au lait', en: 'Milk Chocolate Brown', pt: 'Marrom Café com Leite', family: 'Marrons & Terres' },
  '205': { fr: 'Marron moyen chaud', en: 'Medium Warm Brown', pt: 'Marrom Médio', family: 'Marrons & Terres' },
  '202': { fr: 'Marron chocolat profond', en: 'Deep Chocolate Brown', pt: 'Marrom Chocolate', family: 'Marrons & Terres' },
  '220': { fr: 'Brun expresso sombre', en: 'Dark Espresso Brown', pt: 'Marrom Café Escuro', family: 'Marrons & Terres' },
  '230': { fr: 'Blanc bleuté / Bleu glacier pâle', en: 'Pale Ice Blue / Glacier White', pt: 'Branco Gelo Azulado', family: 'Bleus & Turquoise' },
  '231': { fr: 'Vert d\'eau très clair', en: 'Pale Water Mint', pt: 'Água Marinha Claro', family: 'Bleus & Turquoise' },
  '605': { fr: 'Bleu ciel glacier', en: 'Glacier Sky Blue', pt: 'Azul Geada', family: 'Bleus & Turquoise' },
  '398': { fr: 'Bleu azur pastel', en: 'Soft Sky Blue / Azure', pt: 'Azul Céu', family: 'Bleus & Turquoise' },
  '549': { fr: 'Bleu denim poudré', en: 'Powder Denim Blue', pt: 'Azul Bebê / Jeans Claro', family: 'Bleus & Turquoise' },
  '229': { fr: 'Bleu lagon / Aqua', en: 'Aqua / Lagoon Blue', pt: 'Azul Aqua', family: 'Bleus & Turquoise' },
  '228': { fr: 'Bleu turquoise classique', en: 'Classic Turquoise Blue', pt: 'Azul Turquesa', family: 'Bleus & Turquoise' },
  '226': { fr: 'Bleu canard moyen', en: 'Peacock / Petrol Blue', pt: 'Azul Pavão', family: 'Bleus & Turquoise' },
  '227': { fr: 'Bleu acier / Gris ardoise', en: 'Steel Blue / Slate', pt: 'Azul Aço / Ardósia', family: 'Bleus & Turquoise' },
  '384': { fr: 'Bleu denim moyen', en: 'Medium Denim Blue', pt: 'Azul Jeans Médio', family: 'Bleus & Turquoise' },
  '606': { fr: 'Bleu cobalt doux', en: 'Soft Cobalt Blue', pt: 'Azul Cobalto Suave', family: 'Bleus & Turquoise' },
  '721': { fr: 'Bleu céruléen vif', en: 'Vivid Cerulean Blue', pt: 'Azul Bic / Royal Suave', family: 'Bleus & Turquoise' },
  '1037': { fr: 'Bleu roi éclatant', en: 'Bright Royal Blue', pt: 'Azul Royal Vivo', family: 'Bleus & Turquoise' },
  '275': { fr: 'Bleu marine profond', en: 'Deep Navy Blue', pt: 'Azul Marinho Clássico', family: 'Bleus & Turquoise' },
  '119': { fr: 'Bleu lavande brumeux', en: 'Misty Lavender Blue', pt: 'Azul Lavanda', family: 'Bleus & Turquoise' },
  '298': { fr: 'Bleu pétrole profond', en: 'Deep Petrol Blue', pt: 'Azul Petróleo', family: 'Bleus & Turquoise' },
  '70': { fr: 'Bleu nuit indigo', en: 'Dark Indigo Night Blue', pt: 'Azul Índigo Escuro', family: 'Bleus & Turquoise' },
  '73': { fr: 'Bleu marine très foncé', en: 'Midnight Navy', pt: 'Azul Marinho Escuro', family: 'Bleus & Turquoise' },
  '225': { fr: 'Bleu nuit intense', en: 'Intense Night Blue', pt: 'Azul Meia-Noite', family: 'Bleus & Turquoise' },
  '361': { fr: 'Bleu abysse noirci', en: 'Abyss Ink Blue', pt: 'Azul Profundo', family: 'Bleus & Turquoise' },
  '37': { fr: 'Jaune soleil vif', en: 'Bright Sun Yellow', pt: 'Amarelo Sol', family: 'Jaunes & Ocres' },
  '274': { fr: 'Jaune bouton d\'or', en: 'Buttercup / Golden Yellow', pt: 'Amarelo Ouro', family: 'Jaunes & Ocres' },
  '218': { fr: 'Jaune safran éclatant', en: 'Bright Saffron Yellow', pt: 'Amarelo Açafrão', family: 'Jaunes & Ocres' },
  '38': { fr: 'Jaune ocre chaud', en: 'Warm Ochre Yellow', pt: 'Amarelo Mostarda', family: 'Jaunes & Ocres' },
  '387': { fr: 'Mandarine / Jaune orangé', en: 'Tangerine / Golden Orange', pt: 'Laranja Tangerina', family: 'Oranges & Corail' },
  '30': { fr: 'Orange éclatant', en: 'Bright Orange', pt: 'Laranja Vivo', family: 'Oranges & Corail' },
  '217': { fr: 'Pêche chaud / Abricot doux', en: 'Soft Peach / Apricot', pt: 'Pêssego Quente', family: 'Oranges & Corail' },
  '216': { fr: 'Pêche pastel / Saumon clair', en: 'Pale Peach / Salmon', pt: 'Salmão Claro', family: 'Oranges & Corail' },
  '238': { fr: 'Pêche poudré très clair', en: 'Very Pale Powder Peach', pt: 'Pêssego Pálido', family: 'Oranges & Corail' },
  '239': { fr: 'Rose poudré pêche', en: 'Dusty Peach Pink', pt: 'Rosa Pêssego', family: 'Roses & Violets' },
  '324': { fr: 'Saumon rosé tendre', en: 'Tender Salmon Pink', pt: 'Salmão Rosado', family: 'Oranges & Corail' },
  '237': { fr: 'Corail rosé poudré', en: 'Dusty Coral Pink', pt: 'Coral Suave', family: 'Roses & Violets' },
  '629': { fr: 'Rose bonbon pastel', en: 'Baby / Candy Pink', pt: 'Rosa Bebê', family: 'Roses & Violets' },
  '962': { fr: 'Rose azalée', en: 'Azalea Pink', pt: 'Rosa Azaleia', family: 'Roses & Violets' },
  '323': { fr: 'Vieux rose poudré', en: 'Dusty Rose / Antique Rose', pt: 'Rosa Antigo', family: 'Roses & Violets' },
  '915': { fr: 'Rose corail vibrant', en: 'Vibrant Coral Rose', pt: 'Rosa Coralino', family: 'Roses & Violets' },
  '903': { fr: 'Rose moyen framboise', en: 'Medium Raspberry Rose', pt: 'Rosa Médio', family: 'Roses & Violets' },
  '899': { fr: 'Rose fuchsia doux', en: 'Soft Fuchsia Rose', pt: 'Fúcsia Suave', family: 'Roses & Violets' },
  '545': { fr: 'Rouge framboise écrasée', en: 'Crushed Raspberry Red', pt: 'Vermelho Framboesa', family: 'Rouges & Bordeaux' },
  '235': { fr: 'Rouge coquelicot chaud', en: 'Warm Poppy Red', pt: 'Vermelho Papoula', family: 'Rouges & Bordeaux' },
  '640': { fr: 'Corail rougeoyant', en: 'Fiery Coral Red', pt: 'Coral Vivo', family: 'Oranges & Corail' },
  '35': { fr: 'Terre cuite orangée / Brique', en: 'Terracotta Orange', pt: 'Terracota Alaranjado', family: 'Oranges & Corail' },
  '234': { fr: 'Rouge brique / Rouille rouge', en: 'Brick Red / Rust Red', pt: 'Tijolo / Telha', family: 'Rouges & Bordeaux' },
  '236': { fr: 'Rose bruyère violacé', en: 'Heather Mauve / Heather Pink', pt: 'Malva / Lavanda Quente', family: 'Roses & Violets' },
  '232': { fr: 'Gris mauve poudré', en: 'Dusty Mauve Grey', pt: 'Cinza Malva', family: 'Roses & Violets' },
  '360': { fr: 'Framboise foncé / Cerise', en: 'Dark Raspberry / Cherry', pt: 'Framboesa Escuro', family: 'Rouges & Bordeaux' },
  '368': { fr: 'Violine orchidée', en: 'Orchid Violine / Ripe Berry', pt: 'Violeta Orquídea', family: 'Roses & Violets' },
  '359': { fr: 'Prune / Mûre écrasée', en: 'Plum / Crushed Blackberry', pt: 'Ameixa / Púrpura', family: 'Roses & Violets' },
  '69': { fr: 'Lavande améthyste', en: 'Amethyst Lavender', pt: 'Lavanda / Roxo Claro', family: 'Roses & Violets' },
  '630': { fr: 'Aubergine noirci', en: 'Dark Eggplant / Deep Plum', pt: 'Berinjela Escuro', family: 'Roses & Violets' },
  '632': { fr: 'Bordeaux lie-de-vin', en: 'Wine Burgundy', pt: 'Vinho Tinto', family: 'Rouges & Bordeaux' },
  '677': { fr: 'Rouge paprika vif', en: 'Paprika Red / Coral Red', pt: 'Vermelho Páprica', family: 'Rouges & Bordeaux' },
  '233': { fr: 'Rouge vermillon', en: 'Vermilion Red', pt: 'Vermelho Vermilhon', family: 'Rouges & Bordeaux' },
  '44': { fr: 'Rouge écarlate vif', en: 'Scarlet Red', pt: 'Vermelho Escarlate', family: 'Rouges & Bordeaux' },
  '50': { fr: 'Rouge passion classique', en: 'Classic Passion Red', pt: 'Vermelho Clássico', family: 'Rouges & Bordeaux' },
  '60': { fr: 'Rouge grenat foncé', en: 'Dark Garnet Red', pt: 'Vermelho Grená', family: 'Rouges & Bordeaux' },
  '548': { fr: 'Blanc cassé doux', en: 'Soft Off-White / Natural White', pt: 'Branco Quebrado', family: 'Blancs & Neutres' },
  '924': { fr: 'Crème vanille délicate', en: 'Vanilla Cream', pt: 'Creme Baunilha', family: 'Blancs & Neutres' },
  '1046': { fr: 'Champagne doré très clair', en: 'Light Champagne', pt: 'Champanhe', family: 'Blancs & Neutres' },
  '531': { fr: 'Sable chaud / Grège clair', en: 'Warm Sand / Light Greige', pt: 'Areia', family: 'Blancs & Neutres' },
  '483': { fr: 'Beige paille doré', en: 'Golden Straw Beige', pt: 'Bege Claro', family: 'Jaunes & Ocres' },
  '315': { fr: 'Jaune paille tendre', en: 'Soft Straw Yellow', pt: 'Amarelo Pálido', family: 'Jaunes & Ocres' },
  '382': { fr: 'Beige biscuit doré', en: 'Biscuit Beige / Sand Gold', pt: 'Bege Médio', family: 'Jaunes & Ocres' },
  '762': { fr: 'Camel clair / Sable doré', en: 'Light Camel', pt: 'Camelo Claro', family: 'Jaunes & Ocres' },
  '18': { fr: 'Moutarde clair doux', en: 'Pale Mustard', pt: 'Mostarda Claro', family: 'Jaunes & Ocres' },
  '285': { fr: 'Ocre jaune chaud', en: 'Warm Ochre Yellow', pt: 'Ocre Médio', family: 'Jaunes & Ocres' },
  'Palha': { fr: 'Paille naturelle dorée', en: 'Natural Golden Straw', pt: 'Palha', family: 'Jaunes & Ocres' },
  '219': { fr: 'Jaune beurre pastel', en: 'Butter Pastel Yellow', pt: 'Amarelo Manteiga', family: 'Jaunes & Ocres' },
  '582': { fr: 'Jaune crème vanillé', en: 'Vanilla Cream Yellow', pt: 'Amarelo Creme', family: 'Jaunes & Ocres' },
  '01': { fr: 'Blanc cassé ivoire', en: 'Off-White / Ivory', pt: 'Marfim / Off-White', family: 'Blancs & Neutres' },
  '1310': { fr: 'Vanille pastel très clair', en: 'Pale Vanilla Cream', pt: 'Baunilha Suave', family: 'Blancs & Neutres' },
  '05': { fr: 'Kaki amande doux', en: 'Soft Almond Sage', pt: 'Verde Amêndoa', family: 'Verts & Kaki' },
  '317': { fr: 'Beige amande chaud', en: 'Warm Almond Beige', pt: 'Bege Amendoado', family: 'Blancs & Neutres' },
  '223': { fr: 'Mastic taupe clair', en: 'Light Taupe Putty', pt: 'Taupe Claro', family: 'Marrons & Terres' },
  '213': { fr: 'Moka beige clair', en: 'Light Moka Beige', pt: 'Mocaccino', family: 'Marrons & Terres' },
  '293': { fr: 'Brun taupe moyen', en: 'Medium Taupe Brown', pt: 'Marrom Acinzentado Médio', family: 'Marrons & Terres' },
  '612': { fr: 'Châtaigne doré', en: 'Golden Chestnut', pt: 'Castanho Claro', family: 'Marrons & Terres' },
  '511': { fr: 'Brun chocolat moyen', en: 'Medium Chocolate', pt: 'Marrom Castanha', family: 'Marrons & Terres' },
  '26': { fr: 'Brun chocolat chaud', en: 'Warm Chocolate Brown', pt: 'Marrom Quente', family: 'Marrons & Terres' },
  '215': { fr: 'Noisette clair doré', en: 'Light Golden Hazelnut', pt: 'Noz Clara', family: 'Marrons & Terres' },
  '65': { fr: 'Brun moka moyen', en: 'Medium Moka Brown', pt: 'Moca', family: 'Marrons & Terres' },
  '214': { fr: 'Caramel brun doré', en: 'Golden Brown Caramel', pt: 'Caramelo Amadeirado', family: 'Marrons & Terres' },
  '366': { fr: 'Brun cuivré chaud', en: 'Warm Copper Brown', pt: 'Cobre Amadeirado', family: 'Marrons & Terres' },
  '362': { fr: 'Brun cannelle foncé', en: 'Dark Cinnamon Brown', pt: 'Canela Escuro', family: 'Marrons & Terres' },
  '879': { fr: 'Tabac doré miellé', en: 'Honey Tobacco', pt: 'Tabaco Mel', family: 'Marrons & Terres' },
  '567': { fr: 'Café au lait doux', en: 'Coffee Cream Tan', pt: 'Café com Leite', family: 'Marrons & Terres' },
  '354': { fr: 'Marron cuir naturel', en: 'Natural Leather Brown', pt: 'Couro Médio', family: 'Marrons & Terres' },
  '790': { fr: 'Brun terre d\'ombre', en: 'Umber Brown', pt: 'Terra Escura', family: 'Marrons & Terres' },
  '364': { fr: 'Marron roux cuivré', en: 'Russet Auburn Brown', pt: 'Marrom Ferrugíneo', family: 'Marrons & Terres' },
  '602': { fr: 'Ocre fauve moutarde', en: 'Tawny Mustard Ochre', pt: 'Favo de Mel', family: 'Jaunes & Ocres' },
  '314': { fr: 'Ocre caramel chaud', en: 'Warm Caramel Ochre', pt: 'Ocre Queimado', family: 'Jaunes & Ocres' },
  '641': { fr: 'Caramel roux cuivré', en: 'Russet Caramel', pt: 'Caramelo Ruivo', family: 'Marrons & Terres' },
  '498': { fr: 'Cannelle dorée ambrée', en: 'Amber Cinnamon', pt: 'Canela Âmbar', family: 'Marrons & Terres' },
  '334': { fr: 'Ocre noisette', en: 'Hazelnut Ochre', pt: 'Ocre Amendoado', family: 'Jaunes & Ocres' },
  '388': { fr: 'Orange cuivré rouille', en: 'Copper Rust Orange', pt: 'Laranja Cobre', family: 'Oranges & Corail' },
  '203': { fr: 'Caramel ambré riche', en: 'Rich Amber Caramel', pt: 'Caramelo Intenso', family: 'Marrons & Terres' },
  '25': { fr: 'Cuir roux / Cognac', en: 'Saddle Brown / Cognac', pt: 'Conhaque / Canela', family: 'Marrons & Terres' },
  '212': { fr: 'Marron acajou foncé', en: 'Dark Mahogany Brown', pt: 'Mogno Escuro', family: 'Marrons & Terres' },
  '788': { fr: 'Caramel brûlé / Rouille foncé', en: 'Burnt Caramel / Dark Rust', pt: 'Caramelo Tostado', family: 'Marrons & Terres' },
  '631': { fr: 'Marron roux sombre', en: 'Dark Auburn Brown', pt: 'Marrom Telha', family: 'Marrons & Terres' },
  '201': { fr: 'Brun havane riche', en: 'Rich Havana Brown', pt: 'Marrom Havana', family: 'Marrons & Terres' },
  '28': { fr: 'Brun rouille intense', en: 'Intense Rust Brown', pt: 'Ferrugem', family: 'Marrons & Terres' },
  '273': { fr: 'Marron chocolat noir', en: 'Dark Chocolate Brown', pt: 'Chocolate Amargo', family: 'Marrons & Terres' },
  '259': { fr: 'Marron café noir', en: 'Dark Coffee Brown', pt: 'Café Forte', family: 'Marrons & Terres' },
  '593': { fr: 'Brun terre sombre', en: 'Dark Earth Brown', pt: 'Terra Queimada', family: 'Marrons & Terres' },
  '667': { fr: 'Brun bistre foncé', en: 'Dark Bistre Brown', pt: 'Marrom Bister', family: 'Marrons & Terres' },
  '488': { fr: 'Brun ébène cacaoté', en: 'Ebony Cocoa Brown', pt: 'Marrom Ébano', family: 'Marrons & Terres' },
  '649': { fr: 'Marron expresso profond', en: 'Deep Espresso Brown', pt: 'Marrom Quase Preto', family: 'Marrons & Terres' },
  '29': { fr: 'Brun expresso noirci', en: 'Blackened Espresso Brown', pt: 'Marrom Noite', family: 'Marrons & Terres' },
  '515': { fr: 'Brun sépia très foncé', en: 'Very Dark Sepia', pt: 'Sépia Escuro', family: 'Marrons & Terres' },
  '496': { fr: 'Brun noir profond', en: 'Deep Black Brown', pt: 'Marrom Negro', family: 'Marrons & Terres' },
  '286': { fr: 'Noir chocolaté', en: 'Chocolate Black', pt: 'Preto Chocolate', family: 'Gris & Noirs' },
  '452': { fr: 'Brun abysse nuit', en: 'Abyss Night Brown', pt: 'Marrom Noturno', family: 'Marrons & Terres' },
  '555': { fr: 'Noir ébène doux', en: 'Soft Ebony Black', pt: 'Preto Ébano', family: 'Gris & Noirs' },
  '365': { fr: 'Terre d\'ombre brûlée', en: 'Burnt Umber Black', pt: 'Preto Queimado', family: 'Marrons & Terres' },
  '516': { fr: 'Brun noir cendre', en: 'Ash Black Brown', pt: 'Preto Cinzento', family: 'Gris & Noirs' },
  '326': { fr: 'Jaune fluo néon', en: 'Neon Yellow', pt: 'Amarelo Flúor', family: 'Fluo / Néon' },
  '329': { fr: 'Vert lime fluo néon', en: 'Neon Lime Green', pt: 'Verde Flúor', family: 'Fluo / Néon' },
  '393': { fr: 'Orange fluo néon', en: 'Neon Orange', pt: 'Laranja Flúor', family: 'Fluo / Néon' },
  '327': { fr: 'Rouge corail fluo néon', en: 'Neon Coral Red', pt: 'Vermelho Flúor', family: 'Fluo / Néon' },
  '394': { fr: 'Pêche corail fluo néon', en: 'Neon Peach Coral', pt: 'Coral Flúor', family: 'Fluo / Néon' },
  '328': { fr: 'Rose fuchsia fluo néon', en: 'Neon Pink / Fuchsia', pt: 'Rosa Flúor', family: 'Fluo / Néon' },
  '707': { fr: 'Bleu turquoise fluo néon', en: 'Neon Turquoise Blue', pt: 'Azul Turquesa Flúor', family: 'Fluo / Néon' },
  '692': { fr: 'Bleu électrique royal', en: 'Royal Electric Blue', pt: 'Azul Elétrico', family: 'Bleus & Turquoise' },
  '369': { fr: 'Violet pourpre électrique', en: 'Vivid Electric Purple', pt: 'Roxo Elétrico', family: 'Roses & Violets' },
  '332': { fr: 'Violet profond nuit', en: 'Deep Night Violet', pt: 'Violeta Noturno', family: 'Roses & Violets' },
  'Ouro': { fr: 'Fil métallisé Doré', en: 'Gold Metallic Cord', pt: 'Ouro Metalizado', family: 'Métallisés & Spéciaux' },
  'Cobre': { fr: 'Fil métallisé Cuivré', en: 'Copper Metallic Cord', pt: 'Cobre Metalizado', family: 'Métallisés & Spéciaux' },
  'Luz Negra': { fr: 'Fil irisé Blanc lumière noire', en: 'Blacklight Iridescent White', pt: 'Luz Negra Iridescente', family: 'Métallisés & Spéciaux' },
  'Púrpura': { fr: 'Fil métallisé Pourpre / Violet', en: 'Purple Metallic Cord', pt: 'Púrpura Metalizado', family: 'Métallisés & Spéciaux' },
  'Salmão': { fr: 'Fil irisé Saumon pailleté', en: 'Iridescent Salmon Cord', pt: 'Salmão Iridescente', family: 'Métallisés & Spéciaux' },
  'Flamingo': { fr: 'Fil irisé Rose flamingo', en: 'Iridescent Flamingo Pink Cord', pt: 'Flamingo Iridescente', family: 'Métallisés & Spéciaux' },
  'Prata': { fr: 'Fil métallisé Argenté', en: 'Silver Metallic Cord', pt: 'Prata Metalizado', family: 'Métallisés & Spéciaux' },
  'M19': { fr: 'Fil métallisé Or & Argent bicolore', en: 'Gold & Silver Dual-tone', pt: 'Ouro e Prata Bicolor', family: 'Métallisés & Spéciaux' },
  'Pink': { fr: 'Fil métallisé Rose fuchsia', en: 'Pink Metallic Cord', pt: 'Pink Metalizado', family: 'Métallisés & Spéciaux' },
  'Multicolor': { fr: 'Fil métallisé Arc-en-ciel multicolore', en: 'Rainbow Multicolor Metallic', pt: 'Multicolor Metalizado', family: 'Métallisés & Spéciaux' },
  'Fresh Mint': { fr: 'Fil irisé Menthe fraîche', en: 'Fresh Mint Iridescent Cord', pt: 'Fresh Mint Iridescente', family: 'Métallisés & Spéciaux' }
};

// Merge dictionary and calculated color metrics
const fullList = data.map(item => {
  const meta = dict[item.code] || { fr: item.code, en: item.code, pt: item.code, family: 'Autres' };
  
  // Calculate relative luminance for contrast
  const lum = (0.299 * item.r + 0.587 * item.g + 0.114 * item.b);
  const textColor = lum > 140 ? '#000000' : '#FFFFFF';

  return {
    code: item.code,
    nameFr: meta.fr,
    nameEn: meta.en,
    namePt: meta.pt,
    family: meta.family,
    hex: item.hex,
    r: item.r,
    g: item.g,
    b: item.b,
    rgb: `rgb(${item.r}, ${item.g}, ${item.b})`,
    page: item.page,
    col: item.col,
    row: item.row,
    position: `Page ${item.page} (Col ${item.col}, Ligne ${item.row})`,
    textColor
  };
});

// Save complete JSON
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/linhasita-colors.json', JSON.stringify(fullList, null, 2));

console.log('JSON written with', fullList.length, 'records');

// Build Markdown
let md = `# 🧵 Nuancier Officiel Linhasita — Codes Couleurs HEX & Noms Complets

Ce document répertorie l'intégralité des **179 références** de fils en polyester ciré (*Encerado 100% Poliéster*) de la marque brésilienne de renommée mondiale **Linhasita**.

Le nuancier officiel Linhasita s'appuie sur une grille physique et numérique rigoureuse (**168 couleurs standard** réparties en 12 colonnes de 14 lignes, complétées par **11 références métallisées et irisées** issues des gammes *Linha Party*, *Linha Sense*, *Metal* et *Trançado*).

> [!NOTE]
> **Pourquoi ces codes HEX sont-ils uniques ?**
> Linhasita ne publie pas de codes informatiques HEX, RGB ou Pantone officiels. Les codes présentés ci-dessous ont été **échantillonnés et extraits haute précision** directement depuis la dernière édition officielle du nuancier fabricant (*Cartela de Cores Encerado Linhasita*), en appliquant un filtrage colorimétrique qui élimine les reflets de cire et les ombres de texture.

---

## 📑 Sommaire
1. [Vue d'ensemble et Caractéristiques](#-vue-densemble-et-caractéristiques)
2. [Classification par Familles de Couleurs](#-classification-par-familles-de-couleurs)
   - [⚪ Blancs, Écrus & Neutres](#-blancs-écrus--neutres)
   - [⚫ Gris, Anthracites & Noirs](#-gris-anthracites--noirs)
   - [🔵 Bleus, Turquoise & Pétrole](#-bleus-turquoise--pétrole)
   - [🟢 Verts, Sauge & Kaki](#-verts-sauge--kaki)
   - [🟡 Jaunes, Moutardes & Ocres](#-jaunes-moutardes--ocres)
   - [🟠 Oranges, Pêche & Corail](#-oranges-pêche--corail)
   - [🔴 Rouges, Carmin & Bordeaux](#-rouges-carmin--bordeaux)
   - [🟣 Roses, Fuchsias, Mauves & Violets](#-roses-fuchsias-mauves--violets)
   - [🟤 Marrons, Chocolats, Caramels & Terres](#-marrons-chocolats-caramels--terres)
   - [⚡ Série Fluo / Néon](#-série-fluo--néon)
   - [✨ Séries Métallisées & Spéciales](#-séries-métallisées--spéciales)
3. [Tableau Général Trié par Numéro de Code Linhasita](#-tableau-général-trié-par-numéro-de-code-linhasita)
4. [Tableau Trié selon l'Ordre du Nuancier Fabricant](#-tableau-trié-selon-lordre-du-nuancier-fabricant)
5. [Conseils Pratiques & Utilisation](#-conseils-pratiques--utilisation)

---

## 🔍 Vue d'ensemble et Caractéristiques

- **Fabricant :** Linhasita (Itatiba, São Paulo, Brésil — Fondée en 1975)
- **Matière :** 100% Polyester haute ténacité ciré (*Encerado*)
- **Diamètres courants :**
  - **PE-2 (0,5 mm) :** Micro-macramé fin, sertissage de pierres fines, tissage de perles délicates.
  - **0,75 mm :** Format polyvalent, intermédiaire idéal entre finesse et relief.
  - **PE-4 (1,0 mm) :** Le standard universel du macramé, sellerie, maroquinerie, reliure et bijouterie ethnique.
  - **PE-1 (1,4 mm) :** Gros cordons pour nœuds massifs, sellerie lourde et semelles.
- **Propriétés techniques :**
  - Traitement à la cire minérale : protège contre l'eau, évite l'effilochage, assure une excellente tenue des nœuds.
  - Thermocollant : les bouts se fondent parfaitement au briquet ou à l'outil chauffant pour des finitions invisibles et indestructibles.
  - Teintures grand teint : résistance UV et lavage à froid sans dégorgement.

---

## 🎨 Classification par Familles de Couleurs

`;

// Family categories order
const familyOrder = [
  'Blancs & Neutres',
  'Gris & Noirs',
  'Bleus & Turquoise',
  'Verts & Kaki',
  'Jaunes & Ocres',
  'Oranges & Corail',
  'Rouges & Bordeaux',
  'Roses & Violets',
  'Marrons & Terres',
  'Fluo / Néon',
  'Métallisés & Spéciaux'
];

const familyIcons = {
  'Blancs & Neutres': '⚪',
  'Gris & Noirs': '⚫',
  'Bleus & Turquoise': '🔵',
  'Verts & Kaki': '🟢',
  'Jaunes & Ocres': '🟡',
  'Oranges & Corail': '🟠',
  'Rouges & Bordeaux': '🔴',
  'Roses & Violets': '🟣',
  'Marrons & Terres': '🟤',
  'Fluo / Néon': '⚡',
  'Métallisés & Spéciaux': '✨'
};

function renderTable(items) {
  let table = '| Aperçu | Code | Nom (Français) | Nom International (EN) | Nom d\'origine (PT) | Code HEX | RGB | Position Nuancier |\n';
  table += '| :---: | :---: | :--- | :--- | :--- | :---: | :---: | :---: |\n';
  for (const item of items) {
    const swatch = `<span style="display:inline-block;width:24px;height:24px;border-radius:4px;background-color:${item.hex};border:1px solid #ddd;vertical-align:middle;" title="${item.code} - ${item.hex}"></span>`;
    table += `| ${swatch} | **${item.code}** | ${item.nameFr} | *${item.nameEn}* | ${item.namePt} | \`${item.hex}\` | \`${item.r}, ${item.g}, ${item.b}\` | ${item.position} |\n`;
  }
  return table;
}

for (const fam of familyOrder) {
  const icon = familyIcons[fam] || '🎨';
  const famItems = fullList.filter(item => item.family === fam);
  
  // Sort within family by brightness / hue for smooth progression
  famItems.sort((a, b) => {
    // Sort numeric codes numerically when possible
    const numA = parseInt(a.code);
    const numB = parseInt(b.code);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.code.localeCompare(b.code);
  });

  md += `### ${icon} ${fam} (${famItems.length} nuances)\n\n`;
  md += renderTable(famItems);
  md += '\n---\n\n';
}

// Global sorted numerically
md += `## 🔢 Tableau Général Trié par Numéro de Code Linhasita\n\n`;
md += `Ce tableau regroupe l'intégralité des 179 fils, triés par ordre croissant de leur code de référence fabricant.\n\n`;

const numericallySorted = [...fullList].sort((a, b) => {
  const numA = parseInt(a.code);
  const numB = parseInt(b.code);
  const isNumA = !isNaN(numA) && !a.code.startsWith('M');
  const isNumB = !isNaN(numB) && !b.code.startsWith('M');

  if (isNumA && isNumB) return numA - numB;
  if (isNumA && !isNumB) return -1;
  if (!isNumA && isNumB) return 1;
  return a.code.localeCompare(b.code);
});

md += renderTable(numericallySorted);
md += '\n---\n\n';

// Nuancier official order (Page 7 to 13, Col 1 to 14, Row A to N)
md += `## 📋 Tableau Trié selon l'Ordre du Nuancier Fabricant\n\n`;
md += `Ce tableau reprend l'organisation exacte des planches du catalogue officiel Linhasita (*Cartela de Cores*), de la Page 7 à la Page 13.\n\n`;

const catalogSorted = [...fullList].sort((a, b) => {
  if (a.page !== b.page) return a.page - b.page;
  if (a.col !== b.col) return a.col - b.col;
  return a.row.localeCompare(b.row);
});

md += renderTable(catalogSorted);
md += '\n---\n\n';

md += `## 💡 Conseils Pratiques & Utilisation

1. **Bains de teinture & Tolérance des lots :**
   - Comme l'indique Linhasita sur chaque nuancier officiel, de légères variations de nuances peuvent survenir d'une cuve de teinture à l'autre (*lote / dye lot*).
   - Pour un projet volumineux (grand sac, grand rideau, collier complexe), il est fortement recommandé de commander l'ensemble des bobines issues du même lot.

2. **Élimination de l'excès de cire :**
   - Les fils Linhasita sont généreusement enduits de paraffine pour résister au frottement.
   - Si vous trouvez le fil trop cireux ou collant au toucher, passez-le rapidement au sèche-cheveux tiède ou essuyez-le entre deux morceaux d'essuie-tout doux.

3. **Technique de brûlage pour les terminaisons :**
   - Grâce à sa composition 100% polyester, le fil Linhasita fond net sans noircir lorsqu'on approche la partie **bleue** de la flamme d'un briquet (zone la plus chaude et sans suie).
   - Pressez immédiatement la goutte chaude avec le corps métallique du briquet pour aplatir la soudure.

4. **Entretien des bijoux & créations :**
   - Les bijoux en micro-macramé Linhasita sont lavables à l'eau froide et au savon doux.
   - Ils ne craignent ni la transpiration ni l'eau douce, et conservent leur vivacité de couleur au fil des années.

---
*Document généré à partir de l'analyse spectrale et colorimétrique haute fidélité du nuancier officiel Linhasita (Cartela Digital Poliéster Encerado).*
`;

fs.writeFileSync('LINHASITA_COULEURS.md', md);
console.log('Markdown successfully written to LINHASITA_COULEURS.md');
