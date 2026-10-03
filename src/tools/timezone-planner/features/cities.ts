// Bundled list of major cities and the IANA zone each one uses. "Name|Country|Zone".

const RAW = `
New York|United States|America/New_York
Los Angeles|United States|America/Los_Angeles
Chicago|United States|America/Chicago
Houston|United States|America/Chicago
Dallas|United States|America/Chicago
Denver|United States|America/Denver
Phoenix|United States|America/Phoenix
San Francisco|United States|America/Los_Angeles
Seattle|United States|America/Los_Angeles
San Diego|United States|America/Los_Angeles
Las Vegas|United States|America/Los_Angeles
Portland|United States|America/Los_Angeles
Boston|United States|America/New_York
Washington DC|United States|America/New_York
Philadelphia|United States|America/New_York
Atlanta|United States|America/New_York
Miami|United States|America/New_York
Detroit|United States|America/Detroit
Minneapolis|United States|America/Chicago
New Orleans|United States|America/Chicago
Austin|United States|America/Chicago
Salt Lake City|United States|America/Denver
Anchorage|United States|America/Anchorage
Honolulu|United States|Pacific/Honolulu
Toronto|Canada|America/Toronto
Vancouver|Canada|America/Vancouver
Montreal|Canada|America/Toronto
Calgary|Canada|America/Edmonton
Edmonton|Canada|America/Edmonton
Winnipeg|Canada|America/Winnipeg
Halifax|Canada|America/Halifax
St. John's|Canada|America/St_Johns
Ottawa|Canada|America/Toronto
Mexico City|Mexico|America/Mexico_City
Guadalajara|Mexico|America/Mexico_City
Monterrey|Mexico|America/Monterrey
Cancun|Mexico|America/Cancun
Tijuana|Mexico|America/Tijuana
Guatemala City|Guatemala|America/Guatemala
San Jose|Costa Rica|America/Costa_Rica
Panama City|Panama|America/Panama
Havana|Cuba|America/Havana
Kingston|Jamaica|America/Jamaica
Santo Domingo|Dominican Republic|America/Santo_Domingo
San Juan|Puerto Rico|America/Puerto_Rico
Bogota|Colombia|America/Bogota
Medellin|Colombia|America/Bogota
Lima|Peru|America/Lima
Quito|Ecuador|America/Guayaquil
Caracas|Venezuela|America/Caracas
La Paz|Bolivia|America/La_Paz
Santiago|Chile|America/Santiago
Buenos Aires|Argentina|America/Argentina/Buenos_Aires
Montevideo|Uruguay|America/Montevideo
Asuncion|Paraguay|America/Asuncion
Sao Paulo|Brazil|America/Sao_Paulo
Rio de Janeiro|Brazil|America/Sao_Paulo
Brasilia|Brazil|America/Sao_Paulo
Manaus|Brazil|America/Manaus
Recife|Brazil|America/Recife
London|United Kingdom|Europe/London
Manchester|United Kingdom|Europe/London
Edinburgh|United Kingdom|Europe/London
Dublin|Ireland|Europe/Dublin
Lisbon|Portugal|Europe/Lisbon
Madrid|Spain|Europe/Madrid
Barcelona|Spain|Europe/Madrid
Paris|France|Europe/Paris
Lyon|France|Europe/Paris
Brussels|Belgium|Europe/Brussels
Amsterdam|Netherlands|Europe/Amsterdam
Luxembourg|Luxembourg|Europe/Luxembourg
Berlin|Germany|Europe/Berlin
Munich|Germany|Europe/Berlin
Frankfurt|Germany|Europe/Berlin
Hamburg|Germany|Europe/Berlin
Zurich|Switzerland|Europe/Zurich
Geneva|Switzerland|Europe/Zurich
Vienna|Austria|Europe/Vienna
Rome|Italy|Europe/Rome
Milan|Italy|Europe/Rome
Prague|Czechia|Europe/Prague
Warsaw|Poland|Europe/Warsaw
Krakow|Poland|Europe/Warsaw
Budapest|Hungary|Europe/Budapest
Bratislava|Slovakia|Europe/Bratislava
Ljubljana|Slovenia|Europe/Ljubljana
Zagreb|Croatia|Europe/Zagreb
Belgrade|Serbia|Europe/Belgrade
Sarajevo|Bosnia and Herzegovina|Europe/Sarajevo
Copenhagen|Denmark|Europe/Copenhagen
Stockholm|Sweden|Europe/Stockholm
Oslo|Norway|Europe/Oslo
Helsinki|Finland|Europe/Helsinki
Reykjavik|Iceland|Atlantic/Reykjavik
Tallinn|Estonia|Europe/Tallinn
Riga|Latvia|Europe/Riga
Vilnius|Lithuania|Europe/Vilnius
Athens|Greece|Europe/Athens
Bucharest|Romania|Europe/Bucharest
Sofia|Bulgaria|Europe/Sofia
Kyiv|Ukraine|Europe/Kyiv
Chisinau|Moldova|Europe/Chisinau
Minsk|Belarus|Europe/Minsk
Moscow|Russia|Europe/Moscow
Saint Petersburg|Russia|Europe/Moscow
Kaliningrad|Russia|Europe/Kaliningrad
Yekaterinburg|Russia|Asia/Yekaterinburg
Novosibirsk|Russia|Asia/Novosibirsk
Vladivostok|Russia|Asia/Vladivostok
Istanbul|Turkey|Europe/Istanbul
Ankara|Turkey|Europe/Istanbul
Tbilisi|Georgia|Asia/Tbilisi
Yerevan|Armenia|Asia/Yerevan
Baku|Azerbaijan|Asia/Baku
Nicosia|Cyprus|Asia/Nicosia
Valletta|Malta|Europe/Malta
Tel Aviv|Israel|Asia/Jerusalem
Jerusalem|Israel|Asia/Jerusalem
Beirut|Lebanon|Asia/Beirut
Amman|Jordan|Asia/Amman
Damascus|Syria|Asia/Damascus
Baghdad|Iraq|Asia/Baghdad
Tehran|Iran|Asia/Tehran
Riyadh|Saudi Arabia|Asia/Riyadh
Jeddah|Saudi Arabia|Asia/Riyadh
Kuwait City|Kuwait|Asia/Kuwait
Doha|Qatar|Asia/Qatar
Manama|Bahrain|Asia/Bahrain
Dubai|United Arab Emirates|Asia/Dubai
Abu Dhabi|United Arab Emirates|Asia/Dubai
Muscat|Oman|Asia/Muscat
Sanaa|Yemen|Asia/Aden
Tashkent|Uzbekistan|Asia/Tashkent
Almaty|Kazakhstan|Asia/Almaty
Bishkek|Kyrgyzstan|Asia/Bishkek
Kabul|Afghanistan|Asia/Kabul
Karachi|Pakistan|Asia/Karachi
Lahore|Pakistan|Asia/Karachi
Islamabad|Pakistan|Asia/Karachi
Mumbai|India|Asia/Kolkata
Delhi|India|Asia/Kolkata
Bengaluru|India|Asia/Kolkata
Hyderabad|India|Asia/Kolkata
Chennai|India|Asia/Kolkata
Kolkata|India|Asia/Kolkata
Pune|India|Asia/Kolkata
Kochi|India|Asia/Kolkata
Colombo|Sri Lanka|Asia/Colombo
Kathmandu|Nepal|Asia/Kathmandu
Dhaka|Bangladesh|Asia/Dhaka
Thimphu|Bhutan|Asia/Thimphu
Male|Maldives|Indian/Maldives
Yangon|Myanmar|Asia/Yangon
Bangkok|Thailand|Asia/Bangkok
Hanoi|Vietnam|Asia/Ho_Chi_Minh
Ho Chi Minh City|Vietnam|Asia/Ho_Chi_Minh
Phnom Penh|Cambodia|Asia/Phnom_Penh
Vientiane|Laos|Asia/Vientiane
Kuala Lumpur|Malaysia|Asia/Kuala_Lumpur
Singapore|Singapore|Asia/Singapore
Jakarta|Indonesia|Asia/Jakarta
Bali|Indonesia|Asia/Makassar
Manila|Philippines|Asia/Manila
Brunei|Brunei|Asia/Brunei
Hong Kong|Hong Kong|Asia/Hong_Kong
Macau|Macau|Asia/Macau
Shanghai|China|Asia/Shanghai
Beijing|China|Asia/Shanghai
Shenzhen|China|Asia/Shanghai
Guangzhou|China|Asia/Shanghai
Chengdu|China|Asia/Shanghai
Taipei|Taiwan|Asia/Taipei
Seoul|South Korea|Asia/Seoul
Busan|South Korea|Asia/Seoul
Pyongyang|North Korea|Asia/Pyongyang
Tokyo|Japan|Asia/Tokyo
Osaka|Japan|Asia/Tokyo
Kyoto|Japan|Asia/Tokyo
Sapporo|Japan|Asia/Tokyo
Ulaanbaatar|Mongolia|Asia/Ulaanbaatar
Sydney|Australia|Australia/Sydney
Melbourne|Australia|Australia/Melbourne
Brisbane|Australia|Australia/Brisbane
Canberra|Australia|Australia/Sydney
Perth|Australia|Australia/Perth
Adelaide|Australia|Australia/Adelaide
Darwin|Australia|Australia/Darwin
Hobart|Australia|Australia/Hobart
Auckland|New Zealand|Pacific/Auckland
Wellington|New Zealand|Pacific/Auckland
Christchurch|New Zealand|Pacific/Auckland
Suva|Fiji|Pacific/Fiji
Port Moresby|Papua New Guinea|Pacific/Port_Moresby
Noumea|New Caledonia|Pacific/Noumea
Apia|Samoa|Pacific/Apia
Nuku'alofa|Tonga|Pacific/Tongatapu
Guam|Guam|Pacific/Guam
Papeete|French Polynesia|Pacific/Tahiti
Cairo|Egypt|Africa/Cairo
Alexandria|Egypt|Africa/Cairo
Tripoli|Libya|Africa/Tripoli
Tunis|Tunisia|Africa/Tunis
Algiers|Algeria|Africa/Algiers
Casablanca|Morocco|Africa/Casablanca
Rabat|Morocco|Africa/Casablanca
Dakar|Senegal|Africa/Dakar
Accra|Ghana|Africa/Accra
Abidjan|Ivory Coast|Africa/Abidjan
Lagos|Nigeria|Africa/Lagos
Abuja|Nigeria|Africa/Lagos
Kinshasa|DR Congo|Africa/Kinshasa
Luanda|Angola|Africa/Luanda
Douala|Cameroon|Africa/Douala
Khartoum|Sudan|Africa/Khartoum
Addis Ababa|Ethiopia|Africa/Addis_Ababa
Nairobi|Kenya|Africa/Nairobi
Dar es Salaam|Tanzania|Africa/Dar_es_Salaam
Kampala|Uganda|Africa/Kampala
Kigali|Rwanda|Africa/Kigali
Mogadishu|Somalia|Africa/Mogadishu
Lusaka|Zambia|Africa/Lusaka
Harare|Zimbabwe|Africa/Harare
Maputo|Mozambique|Africa/Maputo
Windhoek|Namibia|Africa/Windhoek
Johannesburg|South Africa|Africa/Johannesburg
Cape Town|South Africa|Africa/Johannesburg
Durban|South Africa|Africa/Johannesburg
Antananarivo|Madagascar|Indian/Antananarivo
Port Louis|Mauritius|Indian/Mauritius
Azores|Portugal|Atlantic/Azores
Nuuk|Greenland|America/Nuuk
UTC|Universal|UTC
`;

export interface City {
  name: string;
  country: string;
  zone: string;
}

export const CITIES: City[] = RAW.trim()
  .split('\n')
  .map((line) => {
    const [name, country, zone] = line.split('|');
    return { name, country, zone };
  });
