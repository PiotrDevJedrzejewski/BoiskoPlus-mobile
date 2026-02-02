// Mapowanie angielskich nazw województw na polskie
// Identyczne z server/utils/variablesPolandRegion.js
export const regionMap = {
  'Łódź Voivodeship': 'łódzkie',
  'Masovian Voivodeship': 'mazowieckie',
  'Greater Poland Voivodeship': 'wielkopolskie',
  'Lesser Poland Voivodeship': 'małopolskie',
  'Lower Silesian Voivodeship': 'dolnośląskie',
  'Opole Voivodeship': 'opolskie',
  'Silesian Voivodeship': 'śląskie',
  'Lubusz Voivodeship': 'lubuskie',
  'West Pomeranian Voivodeship': 'zachodniopomorskie',
  'Pomeranian Voivodeship': 'pomorskie',
  'Warmian-Masurian Voivodeship': 'warmińsko-mazurskie',
  'Podlaskie Voivodeship': 'podlaskie',
  'Kuyavian-Pomeranian Voivodeship': 'kujawsko-pomorskie',
  'Lublin Voivodeship': 'lubelskie',
  'Subcarpathian Voivodeship': 'podkarpackie',
  'Świętokrzyskie Voivodeship': 'świętokrzyskie',
}

// Odwrotne mapowanie - polskie na angielskie
export const regionMapReverse = Object.fromEntries(
  Object.entries(regionMap).map(([en, pl]) => [pl, en])
)
