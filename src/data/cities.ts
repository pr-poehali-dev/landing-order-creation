export interface City {
  slug: string;
  name: string;
  nameIn: string;
  region: string;
  population: string;
}

export const CITIES: City[] = [
  { slug: "moskva", name: "Москва", nameIn: "Москве", region: "Московская область", population: "12 млн" },
  { slug: "spb", name: "Санкт-Петербург", nameIn: "Санкт-Петербурге", region: "Ленинградская область", population: "5.5 млн" },
  { slug: "novosibirsk", name: "Новосибирск", nameIn: "Новосибирске", region: "Новосибирская область", population: "1.6 млн" },
  { slug: "ekaterinburg", name: "Екатеринбург", nameIn: "Екатеринбурге", region: "Свердловская область", population: "1.5 млн" },
  { slug: "kazan", name: "Казань", nameIn: "Казани", region: "Республика Татарстан", population: "1.3 млн" },
  { slug: "chelyabinsk", name: "Челябинск", nameIn: "Челябинске", region: "Челябинская область", population: "1.1 млн" },
  { slug: "omsk", name: "Омск", nameIn: "Омске", region: "Омская область", population: "1.1 млн" },
  { slug: "samara", name: "Самара", nameIn: "Самаре", region: "Самарская область", population: "1.1 млн" },
  { slug: "rostov-na-donu", name: "Ростов-на-Дону", nameIn: "Ростове-на-Дону", region: "Ростовская область", population: "1.1 млн" },
  { slug: "ufa", name: "Уфа", nameIn: "Уфе", region: "Республика Башкортостан", population: "1.1 млн" },
  { slug: "krasnoyarsk", name: "Красноярск", nameIn: "Красноярске", region: "Красноярский край", population: "1.1 млн" },
  { slug: "voronezh", name: "Воронеж", nameIn: "Воронеже", region: "Воронежская область", population: "1 млн" },
  { slug: "perm", name: "Пермь", nameIn: "Перми", region: "Пермский край", population: "1 млн" },
  { slug: "volgograd", name: "Волгоград", nameIn: "Волгограде", region: "Волгоградская область", population: "1 млн" },
  { slug: "krasnodar", name: "Краснодар", nameIn: "Краснодаре", region: "Краснодарский край", population: "990 тыс" },
  { slug: "saratov", name: "Саратов", nameIn: "Саратове", region: "Саратовская область", population: "840 тыс" },
  { slug: "tyumen", name: "Тюмень", nameIn: "Тюмени", region: "Тюменская область", population: "830 тыс" },
  { slug: "tolyatti", name: "Тольятти", nameIn: "Тольятти", region: "Самарская область", population: "690 тыс" },
  { slug: "izhevsk", name: "Ижевск", nameIn: "Ижевске", region: "Республика Удмуртия", population: "640 тыс" },
  { slug: "barnaul", name: "Барнаул", nameIn: "Барнауле", region: "Алтайский край", population: "630 тыс" },
  { slug: "ulyanovsk", name: "Ульяновск", nameIn: "Ульяновске", region: "Ульяновская область", population: "620 тыс" },
  { slug: "irkutsk", name: "Иркутск", nameIn: "Иркутске", region: "Иркутская область", population: "620 тыс" },
  { slug: "habarovsk", name: "Хабаровск", nameIn: "Хабаровске", region: "Хабаровский край", population: "610 тыс" },
  { slug: "yaroslavl", name: "Ярославль", nameIn: "Ярославле", region: "Ярославская область", population: "600 тыс" },
  { slug: "vladivostok", name: "Владивосток", nameIn: "Владивостоке", region: "Приморский край", population: "590 тыс" },
  { slug: "makhachkala", name: "Махачкала", nameIn: "Махачкале", region: "Республика Дагестан", population: "580 тыс" },
  { slug: "tomsk", name: "Томск", nameIn: "Томске", region: "Томская область", population: "570 тыс" },
  { slug: "orenburg", name: "Оренбург", nameIn: "Оренбурге", region: "Оренбургская область", population: "570 тыс" },
  { slug: "kemerovo", name: "Кемерово", nameIn: "Кемерово", region: "Кемеровская область", population: "560 тыс" },
  { slug: "novokuznetsk", name: "Новокузнецк", nameIn: "Новокузнецке", region: "Кемеровская область", population: "540 тыс" },
  { slug: "ryazan", name: "Рязань", nameIn: "Рязани", region: "Рязанская область", population: "540 тыс" },
  { slug: "astrakhan", name: "Астрахань", nameIn: "Астрахани", region: "Астраханская область", population: "530 тыс" },
  { slug: "naberezhnye-chelny", name: "Набережные Челны", nameIn: "Набережных Челнах", region: "Республика Татарстан", population: "530 тыс" },
  { slug: "penza", name: "Пенза", nameIn: "Пензе", region: "Пензенская область", population: "520 тыс" },
  { slug: "lipetsk", name: "Липецк", nameIn: "Липецке", region: "Липецкая область", population: "500 тыс" },
  { slug: "tula", name: "Тула", nameIn: "Туле", region: "Тульская область", population: "480 тыс" },
  { slug: "kirov", name: "Киров", nameIn: "Кирове", region: "Кировская область", population: "480 тыс" },
  { slug: "cheboksary", name: "Чебоксары", nameIn: "Чебоксарах", region: "Республика Чувашия", population: "470 тыс" },
  { slug: "bryansk", name: "Брянск", nameIn: "Брянске", region: "Брянская область", population: "410 тыс" },
  { slug: "kursk", name: "Курск", nameIn: "Курске", region: "Курская область", population: "450 тыс" },
  { slug: "ivanovo", name: "Иваново", nameIn: "Иваново", region: "Ивановская область", population: "400 тыс" },
  { slug: "magnitogorsk", name: "Магнитогорск", nameIn: "Магнитогорске", region: "Челябинская область", population: "410 тыс" },
  { slug: "tver", name: "Тверь", nameIn: "Твери", region: "Тверская область", population: "420 тыс" },
  { slug: "stavropol", name: "Ставрополь", nameIn: "Ставрополе", region: "Ставропольский край", population: "450 тыс" },
  { slug: "belgorod", name: "Белгород", nameIn: "Белгороде", region: "Белгородская область", population: "390 тыс" },
  { slug: "nizhny-novgorod", name: "Нижний Новгород", nameIn: "Нижнем Новгороде", region: "Нижегородская область", population: "1.2 млн" },
  { slug: "cherepovets", name: "Череповец", nameIn: "Череповце", region: "Вологодская область", population: "310 тыс" },
  { slug: "kaliningrad", name: "Калининград", nameIn: "Калининграде", region: "Калининградская область", population: "490 тыс" },
  { slug: "sochi", name: "Сочи", nameIn: "Сочи", region: "Краснодарский край", population: "430 тыс" },
  { slug: "surgut", name: "Сургут", nameIn: "Сургуте", region: "Ханты-Мансийский АО", population: "380 тыс" },
];

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find(c => c.slug === slug);
}
